package com.swissclassic.mindflow_server.mindmap.repository;


import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends Neo4jRepository<Topic, Long> {
    @Query("""
            MATCH (n:Topic)
            WHERE n.accountId = $accountId 
            AND n.chatRoomId = $chatRoomId
            RETURN n
            """)
    List<Topic> findByAccountIdAndChatRoomId(String accountId, Long chatRoomId);
}