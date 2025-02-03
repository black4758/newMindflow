package com.swissclassic.mindflow_server.conversation.service;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;

import java.util.List;


public interface ChatService {
    ChatResponse processChat(ChatRequest request);
    List<ChatResponse> getChatsByRoom(String accountId, Long roomId);
    List<ChatResponse> getChatsByAccount(String accountId);
}
