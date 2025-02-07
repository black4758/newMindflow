package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import com.swissclassic.mindflow_server.conversation.repository.ConversationSummaryRepository;
import org.springframework.stereotype.Service;

@Service
public class ConversationSummaryServiceImpl implements ConversationSummaryService {

    private final ConversationSummaryRepository repository;

    public ConversationSummaryServiceImpl(ConversationSummaryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void saveConversationSummary(ConversationSummary conversationSummary) {
        repository.save(conversationSummary);
    }
}