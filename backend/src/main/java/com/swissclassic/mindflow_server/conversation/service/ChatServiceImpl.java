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
import java.util.UUID;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {
    private final ChatLogRepository chatLogRepository;
    private final AiServerService aiServerService;

    @Override
    @Transactional
    public ChatResponse processChat(ChatRequest request) {
        try {
            String chatId = UUID.randomUUID().toString();
            AiServerResponse aiResponse = aiServerService.getAiResponse(request);

            List<ChatLog.AnswerSentence> sentences = aiResponse.getAnswerSentences().stream()
                    .map(s -> ChatLog.AnswerSentence.builder()
                            .sentenceId(s.getSentenceId())
                            .content(s.getContent())
                            .build())
                    .collect(Collectors.toList());

            String currentTime = LocalDateTime.now().toString();

            ChatLog chatLog = ChatLog.builder()
                    .id(chatId)
                    .accountId(request.getAccountId())
                    .chatRoomId(request.getChatRoomId())
                    .question(request.getQuestion())
                    .answerSentences(sentences)
                    .createdAt(currentTime)
                    .build();

            ChatLog savedLog = chatLogRepository.save(chatLog);
            return convertToResponse(savedLog);
        } catch (Exception e) {
            log.error("Chat processing error: ", e);
            throw new RuntimeException("채팅 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatResponse> getChatsByRoom(String accountId, Long roomId) {
        return chatLogRepository.findByAccountIdAndChatRoomIdOrderByCreatedAtDesc(accountId, roomId)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
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