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
    private final ChatLogRepository chatLogRepository;

    @Override
    @Transactional
    public ChatResponse processChat(ChatRequest request) {
        try {
            // 1. AI 서버에 요청
            AiServerResponse aiResponse = getAiResponse(request);

            // 2. MongoDB에 저장
            ChatLog chatLog = ChatLog.builder()
                    .id(aiResponse.getId())
                    .accountId(request.getAccountId())
                    .chatRoomId(request.getChatRoomId())
                    .question(request.getQuestion())
                    .answerSentences(convertToAnswerSentences(aiResponse.getAnswerSentences()))
                    .createdAt(LocalDateTime.now().toString())
                    .build();

            ChatLog savedLog = chatLogRepository.save(chatLog);
            return convertToResponse(savedLog);
        } catch (Exception e) {
            log.error("AI Server processing error: ", e);
            throw new RuntimeException("AI 처리 중 오류가 발생했습니다.", e);
        }
    }

    private AiServerResponse getAiResponse(ChatRequest request) {
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
    }

    private List<ChatLog.AnswerSentence> convertToAnswerSentences(List<AiServerResponse.AnswerSentence> aiSentences) {
        return aiSentences.stream()
                .map(s -> ChatLog.AnswerSentence.builder()
                        .sentenceId(s.getSentenceId())
                        .content(s.getContent())
                        .build())
                .collect(Collectors.toList());
    }

    private ChatResponse convertToResponse(ChatLog chatLog) {
        List<ChatResponse.AnswerSentenceDto> sentenceDtos = chatLog.getAnswerSentences().stream()
                .map(s -> ChatResponse.AnswerSentenceDto.builder()
                        .sentenceId(s.getSentenceId())
                        .content(s.getContent())
                        .build())
                .collect(Collectors.toList());

        return ChatResponse.builder()
                .id(chatLog.getId())
                .accountId(chatLog.getAccountId())
                .chatRoomId(chatLog.getChatRoomId())
                .question(chatLog.getQuestion())
                .createdAt(chatLog.getCreatedAt())
                .answerSentences(sentenceDtos)
                .build();
    }
}