package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.AiServerResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServerServiceImpl implements AiServerService {
    private final WebClient aiServerWebClient;

    @Override
    public Mono<String> getChatResponse(ChatRequest chatRequest) {
        // 요청 데이터를 생성
        // Flask API 호출 및 응답 처리
        return aiServerWebClient.post()
                .uri("/chatbot/massage") // Flask 서버의 엔드포인트
                .header("Content-Type", "application/json")
                .bodyValue(chatRequest) // JSON 데이터 전송
                .retrieve()
                .bodyToMono(String.class); // 응답 데이터를 문자열로 변환
    }
    @Override
    public Mono<String> getAllChatResponse(ChatRequest chatRequest){
        return aiServerWebClient.post()
                .uri("/chatbot/all") // Flask 서버의 엔드포인트
                .header("Content-Type", "application/json")
                .bodyValue(chatRequest) // JSON 데이터 전송
                .retrieve()
                .bodyToMono(String.class); // 응답 데이터를 문자열로 변환
    }

}