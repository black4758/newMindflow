package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;

public interface ConversationSummaryService {
    ConversationSummary saveConversationSummary(ConversationSummary conversationSummary);
}