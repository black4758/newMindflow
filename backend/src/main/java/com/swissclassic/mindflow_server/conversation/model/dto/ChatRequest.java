package com.swissclassic.mindflow_server.conversation.model.dto;

import lombok.*;

// ChatRequest, ChatResponse 는 클라이언트(프론트엔드)와 Spring Boot 서버 간의 통신
// 실제 비즈니스 로직에 필요한 데이터 구조
// MongoDB에 저장될 데이터 형식과 매칭

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
