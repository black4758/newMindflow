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
    @Column(name = "chatRoom_id")
    private String chatRoomId;
    private String question;
    @Column(name = "user_Id")
    private Long userId;
    private List<AnswerSentence> answerSentences;
    @Column(name = "create_at")
    private LocalDateTime createAT;
    private boolean processed;

    // Getters and Setters
    @Data
    public static class AnswerSentence {
        private String sentenceId;
        private String content;
        private boolean isDeleted;
        public AnswerSentence(String content) {
            this.sentenceId = UUID.randomUUID().toString();
            this.content = content;
            this.isDeleted = false;
        }

    }
}
