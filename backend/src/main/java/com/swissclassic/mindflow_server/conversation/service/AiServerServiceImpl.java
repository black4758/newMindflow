package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.AiServerResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServerServiceImpl implements AiServerService {

    private final WebClient aiServerWebClient;

    @Override
    public AiServerResponse getAiResponse(ChatRequest request) {
        try {
            return aiServerWebClient
                    .post()
                    .uri("/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(),
                            response -> Mono.error(new RuntimeException("AI 서버 클라이언트 에러")))
                    .onStatus(status -> status.is5xxServerError(),
                            response -> Mono.error(new RuntimeException("AI 서버 내부 에러")))
                    .bodyToMono(AiServerResponse.class)
                    .block();
        } catch (Exception e) {
            log.error("AI 서버 연결 실패: ", e);
            throw new RuntimeException("AI 서버 연결 실패: " + e.getMessage());
        }
    }

}
