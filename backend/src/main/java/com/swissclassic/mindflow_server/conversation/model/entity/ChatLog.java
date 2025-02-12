package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;


@Data
@Document(collection = "chat_logs")
public class ChatLog {
    @Id
    private String id;


    @Field(name = "chat_room_id")
    private long chatRoomId;

    @Field(name = "llm_providers")
    String llmProviders;

    @Field(name = "model_versions")
    private String modelVersion;


//    private long chatRoomId;

    private String question;
    private long userId;
    private List<AnswerSentence> answerSentences;
    private LocalDateTime createdAt;
    private long llmProviderId;
    private long modelVersionId;
    private boolean processed;
}
