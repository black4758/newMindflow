package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.AiServerRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.AiServerResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public interface AiServerService {
    AiServerResponse getAiResponse(ChatRequest request);
}