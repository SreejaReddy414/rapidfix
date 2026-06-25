package com.rapidfix.dispatch.service;

import com.rapidfix.dispatch.dto.PaymentOrderResponse;
import com.rapidfix.dispatch.dto.PaymentStatusResponse;
import com.rapidfix.dispatch.entity.RequestStatus;
import com.rapidfix.dispatch.entity.ServiceRequest;
import com.rapidfix.dispatch.repository.ServiceRequestRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ServiceRequestRepository serviceRequestRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    // ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────
    @Transactional
    public PaymentOrderResponse createOrder(Long requestId, Long userId) {
        ServiceRequest req = getRequestOrThrow(requestId);

        // Guard: only COMPLETED jobs can be paid
        if (req.getStatus() != RequestStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment is only allowed for COMPLETED jobs. Current status: " + req.getStatus());
        }

        // Guard: only the owning user can pay
        if (!req.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. You do not own this request.");
        }

        // Guard: already paid
        if ("PAID".equals(req.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This job has already been paid.");
        }

        if (req.getFinalAmount() == null || req.getFinalAmount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Final amount is not set. Cannot create payment order.");
        }

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            // Razorpay expects amount in paise (₹ × 100)
            long amountInPaise = Math.round(req.getFinalAmount() * 100);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rfx_req_" + requestId);
            orderRequest.put("payment_capture", 1); // auto-capture on payment

            Order order = client.orders.create(orderRequest);
            String orderId = order.get("id");

            // Persist the Razorpay order ID on the service request
            req.setRazorpayOrderId(orderId);
            serviceRequestRepository.save(req);
            log.info("Created Razorpay order {} for serviceRequest {}", orderId, requestId);

            String description = req.getServiceType().name().replace("_", " ") +
                    (req.getTechnicianName() != null ? " by " + req.getTechnicianName() : "");

            return PaymentOrderResponse.builder()
                    .razorpayOrderId(orderId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .keyId(razorpayKeyId)
                    .requestId(requestId)
                    .userName(req.getUserName())
                    .description(description)
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed for request {}: {}", requestId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Payment gateway error: " + e.getMessage());
        }
    }

    // ─── VERIFY PAYMENT (client-side, no webhook needed) ─────────────────────
    /**
     * Called by the frontend immediately after Razorpay checkout succeeds.
     * Verifies the HMAC-SHA256 signature that Razorpay returns in the handler,
     * then marks the ServiceRequest as PAID. No webhook required.
     */
    @Transactional
    public PaymentStatusResponse verifyPayment(Long requestId, String razorpayOrderId,
                                               String razorpayPaymentId, String razorpaySignature) {
        ServiceRequest req = getRequestOrThrow(requestId);

        // Guard: already paid
        if ("PAID".equals(req.getPaymentStatus())) {
            return getPaymentStatus(requestId);
        }

        // Verify Razorpay's HMAC-SHA256 signature: SHA256(orderId + "|" + paymentId, keySecret)
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id",   razorpayOrderId);
            attributes.put("razorpay_payment_id",  razorpayPaymentId);
            attributes.put("razorpay_signature",   razorpaySignature);
            Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
        } catch (RazorpayException e) {
            log.error("Payment signature verification failed for request {}: {}", requestId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment signature verification failed. Possible tampering detected.");
        }

        // Signature valid — mark as PAID
        req.setPaymentStatus("PAID");
        req.setRazorpayPaymentId(razorpayPaymentId);
        req.setRazorpayOrderId(razorpayOrderId);
        req.setPaidAt(LocalDateTime.now());
        req.setStatus(RequestStatus.PAID);
        serviceRequestRepository.save(req);
        log.info("Payment verified and marked PAID for serviceRequest {} (payment: {})", requestId, razorpayPaymentId);

        return getPaymentStatus(requestId);
    }

    // ─── HANDLE WEBHOOK ───────────────────────────────────────────────────────
    @Transactional
    public void handleWebhook(String payload, String razorpaySignature) {
        // Verify HMAC-SHA256 signature
        try {
            boolean valid = Utils.verifyWebhookSignature(payload, razorpaySignature, webhookSecret);
            if (!valid) {
                log.warn("Razorpay webhook signature mismatch — rejecting");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
            }
        } catch (RazorpayException e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook signature error: " + e.getMessage());
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.optString("event", "");
        log.info("Received Razorpay webhook event: {}", eventType);

        if ("payment.captured".equals(eventType)) {
            JSONObject paymentEntity = event
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String razorpayOrderId  = paymentEntity.optString("order_id");
            String razorpayPaymentId = paymentEntity.optString("id");

            serviceRequestRepository.findByRazorpayOrderId(razorpayOrderId).ifPresentOrElse(req -> {
                req.setPaymentStatus("PAID");
                req.setRazorpayPaymentId(razorpayPaymentId);
                req.setPaidAt(LocalDateTime.now());
                req.setStatus(RequestStatus.PAID);
                serviceRequestRepository.save(req);
                log.info("Marked serviceRequest {} as PAID (payment: {})", req.getId(), razorpayPaymentId);
            }, () -> log.warn("No ServiceRequest found for Razorpay orderId: {}", razorpayOrderId));

        } else if ("payment.failed".equals(eventType)) {
            JSONObject paymentEntity = event
                    .getJSONObject("payload")
                    .getJSONObject("payment")
                    .getJSONObject("entity");

            String razorpayOrderId = paymentEntity.optString("order_id");
            serviceRequestRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(req -> {
                req.setPaymentStatus("FAILED");
                serviceRequestRepository.save(req);
                log.warn("Payment FAILED for serviceRequest {}", req.getId());
            });
        }
    }

    // ─── GET PAYMENT STATUS ───────────────────────────────────────────────────
    public PaymentStatusResponse getPaymentStatus(Long requestId) {
        ServiceRequest req = getRequestOrThrow(requestId);
        return PaymentStatusResponse.builder()
                .requestId(requestId)
                .paymentStatus(req.getPaymentStatus())
                .razorpayOrderId(req.getRazorpayOrderId())
                .razorpayPaymentId(req.getRazorpayPaymentId())
                .paidAt(req.getPaidAt())
                .finalAmount(req.getFinalAmount())
                .build();
    }

    // ─── HELPER ───────────────────────────────────────────────────────────────
    private ServiceRequest getRequestOrThrow(Long requestId) {
        return serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Service request not found: " + requestId));
    }
}
