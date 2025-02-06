package com.swissclassic.mindflow_server.mindmap.service;

import com.swissclassic.mindflow_server.mindmap.repository.TopicRelationshipRepository;
import com.swissclassic.mindflow_server.mindmap.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class MindmapServiceImpl implements MindmapService {
    private final Driver neo4jDriver;
    private final TopicRepository topicRepository;
    private final TopicRelationshipRepository relationshipRepository;

    @Override
    public MindmapResponse getMindmapByChatRoom(String accountId, String chatRoomId) {
        try (Session session = neo4jDriver.session(SessionConfig.builder().withDatabase("mindmap").build())) {
            return session.readTransaction(tx -> {
                Result result = tx.run("""
                    MATCH (n:Topic)
                    WHERE n.account_id = $account_id AND n.chat_room_id = $chat_room_id
                    OPTIONAL MATCH (n)-[r]->(m:Topic)
                    WHERE m.account_id = $account_id AND m.chat_room_id = $chat_room_id
                    RETURN {
                        account_id: n.account_id,
                        chat_room_id: n.chat_room_id,
                        nodes: collect(distinct {
                            id: elementId(n),
                            title: n.title,
                            content: n.content,
                            mongo_ref: n.mongo_ref,
                            account_id: n.account_id,
                            chat_room_id: n.chat_room_id,
                            created_at: n.created_at
                        }),
                        relationships: collect(distinct CASE WHEN r IS NOT NULL
                            THEN {
                                source: elementId(n),
                                target: elementId(m),
                                type: type(r)
                            }
                            ELSE null
                        END)
                    } as mindmap
                    """,
                        Values.parameters(
                                "account_id", accountId,
                                "chat_room_id", chatRoomId
                        )
                );

                Record record = result.single();
                Map<String, Object> mindmap = record.get("mindmap").asMap();

                return convertToMindmapResponse(mindmap);
            });
        }
    }

    @Override
    public UserMindmapsResponse getAllUserMindmaps(String accountId) {
        try (Session session = neo4jDriver.session(SessionConfig.builder().withDatabase("mindmap").build())) {
            return session.readTransaction(tx -> {
                Result result = tx.run("""
                    MATCH (n:Topic {account_id: $account_id})
                    WITH DISTINCT n.chat_room_id as chatRoomId
                    MATCH (node:Topic {account_id: $account_id, chat_room_id: chatRoomId})
                    OPTIONAL MATCH (node)-[r]->(m:Topic)
                    WHERE m.account_id = $account_id AND m.chat_room_id = chatRoomId
                    WITH chatRoomId, collect(distinct {
                        id: elementId(node),
                        title: node.title,
                        content: node.content,
                        mongo_ref: node.mongo_ref,
                        account_id: node.account_id,
                        chat_room_id: node.chat_room_id,
                        created_at: node.created_at
                    }) as nodes,
                    collect(distinct CASE WHEN r IS NOT NULL
                        THEN {
                            source: elementId(node),
                            target: elementId(m),
                            type: type(r)
                        }
                        ELSE null
                    END) as relationships
                    RETURN collect({
                        account_id: $account_id,
                        chat_room_id: chatRoomId,
                        nodes: nodes,
                        relationships: relationships
                    }) as mindmaps
                    """,
                        Values.parameters("account_id", accountId)
                );

                List<Map<String, Object>> mindmaps = result.single().get("mindmaps").asList(Value::asMap);
                List<MindmapResponse> mindmapResponses = mindmaps.stream()
                        .map(this::convertToMindmapResponse)
                        .collect(Collectors.toList());

                return UserMindmapsResponse.builder()
                        .accountId(accountId)
                        .mindmaps(mindmapResponses)
                        .totalCount(mindmapResponses.size())
                        .build();
            });
        }
    }

    private MindmapResponse convertToMindmapResponse(Map<String, Object> mindmap) {
        List<Map<String, Object>> nodesData = (List<Map<String, Object>>) mindmap.get("nodes");
        List<Map<String, Object>> relationshipsData = (List<Map<String, Object>>) mindmap.get("relationships");

        List<NodeResponse> nodes = nodesData.stream()
                .filter(Objects::nonNull)
                .map(this::convertToNodeResponse)
                .collect(Collectors.toList());

        List<RelationshipResponse> relationships = relationshipsData.stream()
                .filter(Objects::nonNull)
                .map(this::convertToRelationshipResponse)
                .collect(Collectors.toList());

        return MindmapResponse.builder()
                .accountId((String) mindmap.get("account_id"))
                .chatRoomId((String) mindmap.get("chat_room_id"))
                .nodes(nodes)
                .relationships(relationships)
                .build();
    }

    private NodeResponse convertToNodeResponse(Map<String, Object> node) {
        return NodeResponse.builder()
                .id((String) node.get("id"))
                .title((String) node.get("title"))
                .content((String) node.get("content"))
                .mongoRef((String) node.get("mongo_ref"))
                .accountId((String) node.get("account_id"))
                .chatRoomId((String) node.get("chat_room_id"))
                .createdAt(node.get("created_at") != null ?
                        ((ZonedDateTime) node.get("created_at")).toLocalDateTime() : null)
                .build();
    }

    private RelationshipResponse convertToRelationshipResponse(Map<String, Object> relationship) {
        return RelationshipResponse.builder()
                .source((String) relationship.get("source"))
                .target((String) relationship.get("target"))
                .type((String) relationship.get("type"))
                .build();
    }
}