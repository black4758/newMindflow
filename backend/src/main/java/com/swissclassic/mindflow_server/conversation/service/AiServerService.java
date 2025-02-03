package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import reactor.core.publisher.Mono;

public interface AiServerService {
    Mono<String> getChatResponse(ChatRequest chatRequest);
    Mono<String> getAllChatResponse(ChatRequest chatRequest);
}
