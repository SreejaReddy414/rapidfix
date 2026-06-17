package com.rapidfix.dispatch.repository;

import com.rapidfix.dispatch.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRequestIdOrderByCreatedAtAsc(Long requestId);
}