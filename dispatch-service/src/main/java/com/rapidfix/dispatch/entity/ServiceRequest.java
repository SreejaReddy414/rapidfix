package com.rapidfix.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "service_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long userId;
    @Column(nullable = false) private String userName;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private ServiceType serviceType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false) private Double userLatitude;
    @Column(nullable = false) private Double userLongitude;
    @Column(nullable = false) private String address;

    private Long technicianId;
    private String technicianName;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default private RequestStatus status = RequestStatus.PENDING;

    // ─── QUOTE FIELDS (estimated — filled before visiting) ──
    private Double hourlyRate;
    private Double estimatedHours;
    private Double applianceCharge;      // estimated parts cost
    private Double totalAmount;          // estimated total
    @Column(length = 500) private String quoteNote;
    private LocalDateTime quotedAt;
    private LocalDateTime approvedAt;

    // ─── COMPLETION FIELDS (actual — filled after work done) ─
    private Double actualHours;
    private Double actualApplianceCharge; // ← NEW: actual parts cost after work
    private Double finalAmount;           // (hourlyRate × actualHours) + actualApplianceCharge
    @Column(length = 500) private String completionNote;
    @Builder.Default private Boolean rated = false;
    private Double travelCharge;
    private Double distanceKm;
    private LocalDateTime estimatedArrivalTime;
    @Builder.Default private Integer broadcastAttempts = 0;
    private LocalDateTime broadcastedAt;
    private LocalDateTime completedAt;
    private String technicianPhone;


    @CreationTimestamp @Column(updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;

    // ─── PAYMENT FIELDS ──────────────────────────────────────────
    private String razorpayOrderId;   // e.g. order_xxxxx
    private String razorpayPaymentId; // e.g. pay_xxxxx (set after webhook)
    @Builder.Default
    private String paymentStatus = "UNPAID"; // UNPAID | PAID | FAILED
    private LocalDateTime paidAt;
}