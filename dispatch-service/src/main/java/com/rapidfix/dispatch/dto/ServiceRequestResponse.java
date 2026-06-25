package com.rapidfix.dispatch.dto;

import com.rapidfix.dispatch.entity.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private ServiceType serviceType;
    private String description;
    private Double userLatitude;
    private Double userLongitude;
    private String address;
    private Long technicianId;
    private String technicianName;
    private RequestStatus status;
    private String technicianPhone;
 //   private LocalDateTime estimatedArrivalTime;
    // Quote — estimated before visit
    private Double hourlyRate;
    private Double estimatedHours;
    private Double applianceCharge;       // estimated parts
    private Double totalAmount;           // estimated total
    private String quoteNote;
    private LocalDateTime quotedAt;
    private LocalDateTime approvedAt;
    private Double distanceKm;
    private LocalDateTime estimatedArrivalTime;

    // Completion — actual after work
    private Double actualHours;
    private Double actualApplianceCharge;
    private Double finalAmount;           // actual total
    private String completionNote;
    private Boolean rated;
    private Double travelCharge;
    private Integer broadcastAttempts;
    private LocalDateTime broadcastedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;

    // Payment
    private String paymentStatus;       // UNPAID | PAID | FAILED
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
}