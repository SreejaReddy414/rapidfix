package com.rapidfix.dispatch.mapper;

import com.rapidfix.dispatch.dto.ServiceRequestResponse;
import com.rapidfix.dispatch.entity.ServiceRequest;
import org.springframework.stereotype.Component;

@Component
public class ServiceRequestMapper {
    public ServiceRequestResponse toResponse(ServiceRequest r) {
        return ServiceRequestResponse.builder()
                .id(r.getId()).userId(r.getUserId()).userName(r.getUserName())
                .serviceType(r.getServiceType()).description(r.getDescription())
                .userLatitude(r.getUserLatitude()).userLongitude(r.getUserLongitude())
                .address(r.getAddress()).technicianId(r.getTechnicianId())
                .technicianName(r.getTechnicianName()).status(r.getStatus())
                .hourlyRate(r.getHourlyRate()).estimatedHours(r.getEstimatedHours())
                .applianceCharge(r.getApplianceCharge()).totalAmount(r.getTotalAmount())
                .quoteNote(r.getQuoteNote()).quotedAt(r.getQuotedAt())
                .technicianPhone(r.getTechnicianPhone())
                .approvedAt(r.getApprovedAt())
                .distanceKm(r.getDistanceKm())
                .estimatedArrivalTime(r.getEstimatedArrivalTime())
                .actualHours(r.getActualHours())
                .actualApplianceCharge(r.getActualApplianceCharge())
                .finalAmount(r.getFinalAmount())
                .completionNote(r.getCompletionNote())
                .rated(r.getRated())
                .travelCharge(r.getTravelCharge())
                .broadcastAttempts(r.getBroadcastAttempts())
                .broadcastedAt(r.getBroadcastedAt())
                .completedAt(r.getCompletedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}