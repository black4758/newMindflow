package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.*;
import reactor.core.publisher.Mono;

public interface AiServerService {
    ChatApiResponse getChatResponse(ChatRequest chatRequest);
    ChatAllResponse getAllChatResponse(ChatAllRequest chatRequest);
}
