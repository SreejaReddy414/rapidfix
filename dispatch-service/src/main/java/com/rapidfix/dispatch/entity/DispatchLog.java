package com.rapidfix.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "dispatch_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DispatchLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private Long requestId;
    @Column(nullable = false) private Long technicianId;
    @Column(nullable = false) private String action; // OFFERED, ACCEPTED, REJECTED
    @Column private String notes;
    @CreationTimestamp @Column(updatable = false) private LocalDateTime createdAt;
}
