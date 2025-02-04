package com.swissclassic.mindflow_server.conversation.model.entity;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "conversation_summaries")
public class ConversationSummary {
    @Id
    private String id;
    private String chatRoomId;
    private String summaryContent;
    private Instant timestamp;
}