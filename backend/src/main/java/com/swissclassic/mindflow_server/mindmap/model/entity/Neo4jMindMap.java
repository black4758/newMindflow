package com.swissclassic.mindflow_server.mindmap.model.entity;

import com.swissclassic.mindflow_server.mindmap.model.dto.Neo4jMindMapNode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Node("MindMap")
public class Neo4jMindMap {

    @Id
    @GeneratedValue
    private Long id; // Auto-generated ID for the MindMap

    private String name; // Optional: You can set a default name or allow it to be null

    // Relationship to MindMapNodes
    @Relationship(type = "CONTAINS_NODE", direction = Relationship.Direction.OUTGOING)
    private Set<Neo4jMindMapNode> nodes = new HashSet<>();

    // Constructors
    public Neo4jMindMap() {
    }

    public Neo4jMindMap(String name) {
        this.name = name;
    }

    // Method to add a node to the MindMap
    public void addNode(Neo4jMindMapNode node) {
        this.nodes.add(node);
    }
}
