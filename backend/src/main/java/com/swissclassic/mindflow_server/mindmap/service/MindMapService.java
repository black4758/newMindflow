package com.swissclassic.mindflow_server.mindmap.service;

public interface MindMapService {
    void executeQuery(String cypherQuery);  // Python 서버에서 받은 쿼리 실행
}