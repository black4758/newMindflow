package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Data
@Document(collection = "chat_logs")
public class ChatLog {
    @Id
    private String id;
    private long chatRoomId;
    private String question;
    private long userId;
    private List<AnswerSentence> answerSentences;
    private LocalDateTime createdAt;
    private long modelVersionId;
    private boolean processed;

    // Getters and Setters
    @Data
    public static class AnswerSentence {
        @Field(name = "sentence_id")
        private String sentenceId;
        private String content;
        @Field(name = "is_deleted")
        private boolean isDeleted;
        public AnswerSentence(String content) {
            this.sentenceId = UUID.randomUUID().toString();
            this.content = content;
            this.isDeleted = false;
        }

    }
}
