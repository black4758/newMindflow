package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;

import java.util.List;


// ChatService.java
public interface ChatService {
    List<ChatResponse> getChatsByRoom(String accountId, Long roomId);
    List<ChatResponse> getChatsByAccount(String accountId);
}