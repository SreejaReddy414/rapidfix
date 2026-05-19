package com.rapidfix.technician.mapper;
import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.Technician;
import org.springframework.stereotype.Component;

@Component
public class TechnicianMapper {
    public TechnicianResponse toResponse(Technician t) {
        return TechnicianResponse.builder()
            .id(t.getId()).userId(t.getUserId()).name(t.getName())
            .email(t.getEmail()).phone(t.getPhone())
            .serviceTypes(t.getServiceTypes())
            .availabilityStatus(t.getAvailabilityStatus())
            .latitude(t.getLatitude()).longitude(t.getLongitude())
            .rating(t.getRating()).completedJobs(t.getCompletedJobs())
            .createdAt(t.getCreatedAt()).build();
    }

    public NearbyTechnicianResponse toNearbyResponse(Technician t, double distanceKm) {
        return NearbyTechnicianResponse.builder()
            .id(t.getId())
            .userId(t.getUserId())
            .name(t.getName())
            .serviceTypes(t.getServiceTypes())
            .rating(t.getRating()).completedJobs(t.getCompletedJobs())
            .distanceKm(Math.round(distanceKm * 100.0) / 100.0)
            .latitude(t.getLatitude()).longitude(t.getLongitude()).build();
    }
}