package com.rapidfix.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requestId;

    @Column(nullable = false)
    private Long technicianId;

    private String technicianName;
    private String technicianPhone;

    @Column(nullable = false)
    private Double hourlyRate;

    @Column(nullable = false)
    private Double estimatedHours;

    private Double applianceCharge;
    private Double travelCharge;
    private Double distanceKm;
    private Double totalAmount;

    @Column(length = 500)
    private String quoteNote;

    private LocalDateTime estimatedArrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuoteStatus status = QuoteStatus.PENDING;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
