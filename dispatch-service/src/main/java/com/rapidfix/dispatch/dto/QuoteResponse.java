package com.rapidfix.dispatch.dto;

import com.rapidfix.dispatch.entity.QuoteStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteResponse {
    private Long id;
    private Long requestId;
    private Long technicianId;
    private String technicianName;
    private String technicianPhone;
    private Double hourlyRate;
    private Double estimatedHours;
    private Double applianceCharge;
    private Double travelCharge;
    private Double distanceKm;
    private Double totalAmount;
    private String quoteNote;
    private LocalDateTime estimatedArrivalTime;
    private QuoteStatus status;
    private LocalDateTime createdAt;
}
