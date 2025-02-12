package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatApiResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;

import java.util.List;

public interface ChatLogService {
    void saveChatLog(long chatRoomId, String userInput, String responseSentences,
                            List<ChatApiResponse.AnswerSentence> answerSentences, long userId);
    List<ChatLog> getMessagesByChatRoomId(long chatRoomId);

    // 주제 분리용
    void copyAndUpdateChatLog(String mongoRef, long oldChatRoomId, long newChatRoomId);

    ChatLog findByMongoRef(String mongoRef);
}
