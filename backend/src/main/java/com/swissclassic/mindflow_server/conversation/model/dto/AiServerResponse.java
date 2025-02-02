package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiServerResponse {
    private String status;
    private String answer;
    private String conversationId;
    private List<AnswerSentence> answerSentences;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerSentence {
        private String sentenceId;
        private String content;
    }
}