package com.swissclassic.mindflow_server.mindmap.repository;

import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface TopicRepository extends Neo4jRepository<Topic, String> {

    @Query("""
        MATCH (n:Topic)
        WHERE n.account_id = $accountId
        OPTIONAL MATCH (n)-[r]->(m:Topic)
        RETURN {
            accountId: $accountId, 
            nodes: collect({
                id: elementId(n),
                title: n.title,
                content: n.content,
                mongoRef: n.mongo_ref,
                accountId: n.account_id,
                chatRoomId: n.chat_room_id,
                createdAt: n.created_at
            }),
            relationships: collect(
                CASE 
                    WHEN r IS NOT NULL 
                    THEN {
                        source: elementId(startNode(r)),
                        target: elementId(endNode(r)),
                        type: type(r)
                    }
                    ELSE null
                END
            )
        } AS result
    """)
    List<Map<String, Object>> getTopicByUserId(String accountId);

    @Query("""
    MATCH (n:Topic)
    WHERE n.account_id = $accountId AND n.chat_room_id = $chatRoomId
    OPTIONAL MATCH (n)-[r]->(m:Topic)
    RETURN {
        accountId: $accountId, 
        chatRoomId: $chatRoomId,
        nodes: collect({
            id: elementId(n),
            title: n.title,
            content: n.content,
            mongoRef: n.mongo_ref,
            accountId: n.account_id,
            chatRoomId: n.chat_room_id,
            createdAt: n.created_at
        }),
        relationships: collect(
            CASE 
                WHEN r IS NOT NULL 
                THEN {
                    source: elementId(startNode(r)),
                    target: elementId(endNode(r)),
                    type: type(r)
                }
                ELSE null
            END
        )
    } AS result
""")
    List<Map<String, Object>> getMindMapByUserAndChatRoom(String accountId, String chatRoomId);



}
