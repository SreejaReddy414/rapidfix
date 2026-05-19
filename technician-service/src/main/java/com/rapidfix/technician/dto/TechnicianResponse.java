package com.rapidfix.technician.dto;
import com.rapidfix.technician.entity.AvailabilityStatus;
import com.rapidfix.technician.entity.ServiceType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TechnicianResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Set<ServiceType> serviceTypes;
    private AvailabilityStatus availabilityStatus;
    private Double latitude;
    private Double longitude;
    private Double rating;
    private Integer completedJobs;
    private LocalDateTime createdAt;
}
