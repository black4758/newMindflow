package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ChatResponse {
    private String conversationId;
    private String accountId;  // 추가
    private Long chatRoomId;   // 추가
    private String question;
    private LocalDateTime createdAt;
    private List<AnswerSentenceDto> answerSentences;

    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Builder
    public static class AnswerSentenceDto {
        private String sentenceId;
        private String content;
    }
}
