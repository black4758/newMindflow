package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {
    private String accountId;
    private Long chatRoomId;
    private String question;
}
