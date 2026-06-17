package com.rapidfix.dispatch.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {

    private Long senderId;
    private String senderName;
    private String senderRole;   // "USER" or "TECHNICIAN"
    private String content;
}