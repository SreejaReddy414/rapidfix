package com.rapidfix.dispatch.dto;
import lombok.*;
import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NearbyTechnicianDto {
    private Long id;
    private Long userId;
    private String name;
    private Set<String> serviceTypes;
    private Double rating;
    private Integer completedJobs;
    private Double distanceKm;
    private Double latitude;
    private Double longitude;
}