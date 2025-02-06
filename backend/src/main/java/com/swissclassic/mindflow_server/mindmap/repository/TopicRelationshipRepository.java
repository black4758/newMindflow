package com.swissclassic.mindflow_server.mindmap.repository;

import com.swissclassic.mindflow_server.mindmap.model.entity.TopicRelationship;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRelationshipRepository extends Neo4jRepository<TopicRelationship, Long> {
    @Query("""
        MATCH (source:Topic)-[r]->(target:Topic)
        WHERE source.account_id = $accountId 
        AND source.chat_room_id = $chatRoomId
        AND target.account_id = $accountId 
        AND target.chat_room_id = $chatRoomId
        RETURN source, r, target
    """)
    List<TopicRelationship> findByAccountIdAndChatRoomId(String accountId, String chatRoomId);

    @Query("""
        MATCH (source:Topic)-[r]->(target:Topic)
        WHERE source.account_id = $accountId 
        AND target.account_id = $accountId
        RETURN source, r, target
    """)
    List<TopicRelationship> findByAccountId(String accountId);
}