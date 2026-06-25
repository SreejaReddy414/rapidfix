package com.rapidfix.dispatch.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentStatusResponse {
    private Long   requestId;
    private String paymentStatus;      // UNPAID | PAID | FAILED
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
    private Double finalAmount;
}
