package com.swissclassic.mindflow_server.conversation.model.entity;

import jakarta.persistence.Column;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;


@Data
@Document(collection = "chat_logs")
public class ChatLog {
    @Id
    private String id;

    @Field(name = "chatRoom_id")
    private long chatRoomId;

    @Field(name = "llm_providers")
    String llmProviders;

    @Field(name = "model_versions")
    private String modelVersion;

    private String question;
    @Field(name = "user_id")

    private long userId;

    private List<AnswerSentence> answerSentences;

    @Field(name = "created_at")
    private LocalDateTime createAT;

    private boolean processed;

    // Getters and Setters
    @Data
    public static class AnswerSentence {
        @Field(name = "sentence_id")
        private String sentenceId;
        private String content;
        @Field(name = "is_deleted")
        private boolean isDeleted;

        public AnswerSentence(String sentenceId, String content) {
            this.sentenceId = sentenceId;
            this.content = content;
            this.isDeleted = false;
        }

    }
}
