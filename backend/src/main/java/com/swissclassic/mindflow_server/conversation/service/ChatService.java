package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.AiServerResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatLogRepository chatLogRepository;
    private final AiServerService aiServerService;

    @Transactional
    public ChatResponse processChat(ChatRequest request) {
        try {
            // AI 서버에서 응답 받기
            AiServerResponse aiResponse = aiServerService.getAiResponse(
                    request.getAccountId(),
                    request.getChatRoomId(),
                    request.getQuestion()
            );

            // AI 응답을 ChatLog 형식으로 변환
            List<ChatLog.AnswerSentence> sentences = aiResponse.getAnswerSentences().stream()
                    .map(s -> ChatLog.AnswerSentence.builder()
                            .sentenceId(s.getSentenceId())
                            .content(s.getContent())
                            .build())
                    .collect(Collectors.toList());

            // ChatLog 생성 및 저장
            ChatLog chatLog = ChatLog.builder()
                    .accountId(request.getAccountId())
                    .chatRoomId(request.getChatRoomId())
                    .id(aiResponse.getId())
                    .question(request.getQuestion())
                    .answerSentences(sentences)
                    .createdAt(LocalDateTime.now())
                    .build();

            ChatLog savedLog = chatLogRepository.save(chatLog);

            System.out.println("MongoDB 데이터 저장");

            return convertToResponse(savedLog);
        } catch (Exception e) {
            log.error("Chat processing error: ", e);
            throw new RuntimeException("채팅 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChatsByRoom(String accountId, Long roomId) {
        return chatLogRepository.findByAccountIdAndChatRoomIdOrderByCreatedAtDesc(accountId, roomId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChatsByAccount(String accountId) {
        return chatLogRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(this::convertToResponse)
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