package com.swissclassic.mindflow_server.conversation.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
public class ChatApiResponse {
    @JsonProperty("chat_room_id")
    private long chatRoomId;
    private String model;
    @JsonProperty("detail_model")
    private String detailModel;
    private String response;

    private String accountId;

    private long creatorId;
    
    // 류현석 추가
    @JsonProperty("answer_sentences")
    private List<AnswerSentence> answerSentences;

    @Data
    public static class AnswerSentence {

        private String sentenceId;
        private String content;
    }
}