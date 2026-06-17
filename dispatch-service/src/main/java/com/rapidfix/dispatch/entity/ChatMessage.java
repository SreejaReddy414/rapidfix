package com.rapidfix.dispatch.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity @Table(name = "chat_messages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false) private Long requestId;
    @Column(nullable = false) private Long senderId;
    @Column(nullable = false) private String senderName;
    @Column(nullable = false) private String senderRole; // "USER" or "TECHNICIAN"
    @Column(nullable = false, length = 1000) private String content;

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;
}