package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;

public interface AiServerService {
    ChatResponse processChat(ChatRequest request);  // AI 응답 받기 + MongoDB 저장
}
