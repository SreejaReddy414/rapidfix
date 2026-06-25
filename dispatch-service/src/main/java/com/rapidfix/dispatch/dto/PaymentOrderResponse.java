package com.rapidfix.dispatch.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentOrderResponse {
    private String razorpayOrderId;   // order_xxxxx
    private Long   amount;            // amount in paise (finalAmount × 100)
    private String currency;          // "INR"
    private String keyId;             // Razorpay public key (safe to expose to frontend)
    private Long   requestId;
    private String userName;
    private String description;       // e.g. "AC_REPAIR service by John"
}
