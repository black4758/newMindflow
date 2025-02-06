package com.swissclassic.mindflow_server.mindmap.service;

public interface MindmapService {
    MindmapResponse getMindmapByChatRoom(String accountId, String chatRoomId);
    UserMindmapsResponse getAllUserMindmaps(String accountId);
}