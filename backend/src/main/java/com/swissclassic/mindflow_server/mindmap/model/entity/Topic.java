package com.swissclassic.mindflow_server.mindmap.model.entity;

import lombok.Data;
import org.springframework.data.neo4j.core.schema.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Node("Topic")
@Data
public class Topic {
    @Id @GeneratedValue
    private Long id;

    private String title;
    private String content;
    private String accountId;
    private String chatRoomId;
    private String mongoRef;
    private LocalDateTime createdAt;

    @Relationship(type = "HAS_SUBTOPIC", direction = Relationship.Direction.OUTGOING)
    private Set<Topic> subtopics = new HashSet<>();

    @Relationship(type = "RELATED_TO", direction = Relationship.Direction.OUTGOING)
    private Set<Topic> relatedTopics = new HashSet<>();

    @Relationship(type = "COMPARED_TO", direction = Relationship.Direction.OUTGOING)
    private Set<Topic> comparedTopics = new HashSet<>();
}