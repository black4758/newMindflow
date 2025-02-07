package com.swissclassic.mindflow_server.mindmap.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MindMapRequest {
    private String cypherQuery;
}