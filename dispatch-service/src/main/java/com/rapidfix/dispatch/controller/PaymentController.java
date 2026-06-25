package com.rapidfix.dispatch.controller;

import com.rapidfix.dispatch.dto.PaymentOrderResponse;
import com.rapidfix.dispatch.dto.PaymentStatusResponse;
import com.rapidfix.dispatch.security.JwtUtil;
import com.rapidfix.dispatch.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Razorpay payment gateway integration")
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUtil jwtUtil;

    /**
     * Creates a Razorpay order for a COMPLETED service request.
     * Frontend calls this first, then opens the Razorpay checkout widget.
     */
    @PostMapping("/create-order")
    @PreAuthorize("hasRole('USER')")
    @SecurityRequirement(name = "Bearer")
    @Operation(summary = "Create a Razorpay payment order for a completed service request (USER only)")
    public ResponseEntity<PaymentOrderResponse> createOrder(
            @RequestParam Long requestId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(paymentService.createOrder(requestId, userId));
    }

    /**
     * Verifies payment signature after Razorpay checkout completes in the browser.
     * Uses @RequestBody (JSON) instead of query params to avoid base64 signature encoding issues.
     */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER')")
    @SecurityRequirement(name = "Bearer")
    @Operation(summary = "Verify Razorpay payment signature and mark job as PAID (no webhook needed)")
    public ResponseEntity<PaymentStatusResponse> verifyPayment(
            @RequestBody com.rapidfix.dispatch.dto.VerifyPaymentRequest body) {
        return ResponseEntity.ok(paymentService.verifyPayment(
                body.getRequestId(),
                body.getRazorpayOrderId(),
                body.getRazorpayPaymentId(),
                body.getRazorpaySignature()));
    }

    /**
     * Razorpay webhook endpoint — receives payment events (payment.captured / payment.failed).
     * IMPORTANT: This endpoint MUST NOT require JWT auth — Razorpay doesn't send tokens.
     * Security is enforced via HMAC-SHA256 signature verification inside PaymentService.
     */
    @PostMapping("/webhook")
    @Operation(summary = "Razorpay webhook receiver — no JWT required, verified via HMAC signature")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        log.info("Received Razorpay webhook, signature present: {}", signature != null);
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }

    /**
     * Returns the current payment status for a given service request.
     */
    @GetMapping("/status/{requestId}")
    @SecurityRequirement(name = "Bearer")
    @Operation(summary = "Get payment status for a service request")
    public ResponseEntity<PaymentStatusResponse> getStatus(@PathVariable Long requestId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(requestId));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private Long extractUserId(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer "))
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Missing or invalid Authorization header");
        String token = header.substring(7);
        try { return jwtUtil.extractUserId(token); }
        catch (Exception e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Invalid JWT token");
        }
    }
}
