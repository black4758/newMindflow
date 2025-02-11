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
            nodes: collect(DISTINCT {
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
        nodes: collect(DISTINCT {
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


    @Query("""
            MATCH (n)-[r:HAS_SUBTOPIC*0..]->(m) 
            WHERE elementId(n) = $elementId 
            DETACH DELETE m
            """)
    void deleteSubtopicsByElementId(String elementId);


    // 주제 분리

    @Query("""
            MATCH (n:Topic)
            WHERE elementId(n) = $elementId
            OPTIONAL MATCH (parent:Topic)-[:HAS_SUBTOPIC]->(n)
            RETURN EXISTS((parent)-[:HAS_SUBTOPIC]->(n)) as hasParent
            """)
    boolean hasParent(String elementId);


    @Query("""
        MATCH (n:Topic)
        WHERE elementId(n) = $elementId
        RETURN n.mongo_ref as mongoRef, n.chat_room_id as oldChatRoomId
    """)
    Map<String, Object> findMongoRefAndChatRoomId(String elementId);

    @Query("""
    MATCH (n:Topic)
    WHERE elementId(n) = $elementId
    // 부모 노드와의 관계 찾기
    OPTIONAL MATCH (parent:Topic)-[r]->(n)
    // 하위 노드들 찾기 (n 포함)
    WITH n, r, parent
    MATCH (n)-[*0..]->(descendant:Topic)
    WITH COLLECT(descendant) as nodesToUpdate, r
    // 1. 부모와의 관계 삭제
    DELETE r
    // 2. 모든 연관 노드의 chat_room_id 업데이트
    WITH nodesToUpdate
    UNWIND nodesToUpdate as node
    SET node.chat_room_id = $newChatRoomId
    RETURN COUNT(node) as updatedNodes
""")
    void separateTopicAndUpdateChatRoom(String elementId, String newChatRoomId);




}
