package com.swissclassic.mindflow_server.mindmap.repository;


import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends Neo4jRepository<Topic, Long> {
    @Query("""
        MATCH (topic:Topic)
        WHERE topic.account_id = $accountId AND topic.chat_room_id = $chatRoomId
        RETURN topic
    """)
    List<Topic> findByAccountIdAndChatRoomId(String accountId, String chatRoomId);

    @Query("""
        MATCH (topic:Topic)
        WHERE topic.account_id = $accountId
        RETURN topic
    """)
    List<Topic> findByAccountId(String accountId);
}
