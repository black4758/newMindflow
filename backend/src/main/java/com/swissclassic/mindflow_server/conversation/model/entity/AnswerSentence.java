package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.UUID;

// Getters and Setters
@Data
public class AnswerSentence {
    @Field(name = "sentence_id")
    private String sentenceId;
    private String content;
    @Field(name = "is_deleted")
    private boolean isDeleted;

    public AnswerSentence(String content) {
        this.sentenceId = UUID.randomUUID()
                              .toString();
        this.content = content;
        this.isDeleted = false;
    }

}
