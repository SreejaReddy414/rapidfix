package com.rapidfix.dispatch.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class VerifyPaymentRequest {
    private Long   requestId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
