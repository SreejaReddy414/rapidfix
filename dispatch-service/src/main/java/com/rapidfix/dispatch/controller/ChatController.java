package com.rapidfix.dispatch.controller;

import com.rapidfix.dispatch.dto.ChatMessageDto;
import com.rapidfix.dispatch.entity.ChatMessage;
import com.rapidfix.dispatch.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final SimpMessagingTemplate messagingTemplate;

    // ─── REST: load full chat history when the page opens ────────────────
    @GetMapping("/api/requests/{id}/chat")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Long id) {
        return ResponseEntity.ok(chatRepo.findByRequestIdOrderByCreatedAtAsc(id));
    }

    // ─── WebSocket: receive and broadcast a new message ──────────────────
    // Frontend publishes to:  /app/chat/{requestId}
    // All subscribers listen: /topic/chat/{requestId}
    @MessageMapping("/chat/{requestId}")
    public void sendMessage(@DestinationVariable Long requestId,
                            @Payload ChatMessageDto dto) {

        ChatMessage msg = ChatMessage.builder()
                .requestId(requestId)
                .senderId(dto.getSenderId())
                .senderName(dto.getSenderName())
                .senderRole(dto.getSenderRole())
                .content(dto.getContent())
                .build();

        chatRepo.save(msg);
        messagingTemplate.convertAndSend("/topic/chat/" + requestId, msg);
    }
}