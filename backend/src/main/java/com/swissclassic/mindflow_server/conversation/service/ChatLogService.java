package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;

import java.util.List;

public interface ChatLogService {
    void saveChatLog(String chatRoomId, String userInput, String responseSentences, String modelName); // 대화 저장
    List<ChatLog> getMessagesByChatRoomId(String chatRoomId);
}
