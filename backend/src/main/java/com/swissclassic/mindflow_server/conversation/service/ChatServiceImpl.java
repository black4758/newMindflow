package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {
    private final ChatLogRepository chatLogRepository;

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