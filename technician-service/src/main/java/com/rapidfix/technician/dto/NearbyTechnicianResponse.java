package com.rapidfix.technician.dto;
import com.rapidfix.technician.entity.ServiceType;
import lombok.*;
import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NearbyTechnicianResponse {
    private Long id;
    private Long userId;
    private String name;
    private Set<ServiceType> serviceTypes;
    private Double rating;
    private Integer completedJobs;
    private Double distanceKm;
    private Double latitude;
    private Double longitude;
}