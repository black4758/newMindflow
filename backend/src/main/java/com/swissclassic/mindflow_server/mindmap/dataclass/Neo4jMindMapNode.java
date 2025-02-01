package com.swissclassic.mindflow_server.mindmap.dataclass;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Node("MindMapNode")
public class Neo4jMindMapNode {

    @Id
    private String id; // Same as DTO

    private String title;
    private String content;
    private String mongo_ref;

    // Define relationships to subtopics
    @Relationship(type = "HAS_SUBTOPIC", direction = Relationship.Direction.OUTGOING)
    private Set<Neo4jMindMapNode> subTopics = new HashSet<>();

    // Constructors
    public Neo4jMindMapNode() {
    }

    public Neo4jMindMapNode(String id, String title, String content, String mongo_ref) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.mongo_ref = mongo_ref;
    }

    // Method to add a subtopic
    public void addSubTopic(Neo4jMindMapNode subTopic) {
        this.subTopics.add(subTopic);
    }
}
