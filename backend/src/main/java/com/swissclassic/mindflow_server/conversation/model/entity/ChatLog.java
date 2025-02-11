package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;


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
    private long llmProviderId;
    private long modelVersionId;
    private boolean processed;
}
