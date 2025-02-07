package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.*;
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor
@Builder
public class FirstChatRespose {
    private long chatRoomId;
}
