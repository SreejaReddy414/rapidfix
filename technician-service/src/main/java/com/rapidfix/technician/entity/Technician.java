package com.rapidfix.technician.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.Set;

@Entity @Table(name = "technicians")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Technician {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true) private Long userId;
    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false) private String phone;

    @ElementCollection(targetClass = ServiceType.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "technician_services", joinColumns = @JoinColumn(name = "technician_id"))
    @Enumerated(EnumType.STRING) @Column(name = "service_type")
    private Set<ServiceType> serviceTypes;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default private AvailabilityStatus availabilityStatus = AvailabilityStatus.OFFLINE;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Builder.Default private Double rating = 0.0;
    @Builder.Default private Integer totalRatings = 0;
    @Builder.Default private Integer completedJobs = 0;

    @CreationTimestamp @Column(updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
}