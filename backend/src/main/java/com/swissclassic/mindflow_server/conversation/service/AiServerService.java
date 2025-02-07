package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatAllResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatApiResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import reactor.core.publisher.Mono;

public interface AiServerService {
    ChatApiResponse getChatResponse(ChatRequest chatRequest);
    ChatAllResponse getAllChatResponse(ChatRequest chatRequest);
}
