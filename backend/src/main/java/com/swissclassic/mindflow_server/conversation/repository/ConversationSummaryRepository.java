package com.swissclassic.mindflow_server.conversation.repository;

import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ConversationSummaryRepository extends MongoRepository<ConversationSummary, String> {
}