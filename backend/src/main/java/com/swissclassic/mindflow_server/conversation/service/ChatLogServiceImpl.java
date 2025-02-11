package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatApiResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatLogServiceImpl implements ChatLogService{

    private final ChatLogRepository chatLogRepository;

    @Autowired
    public  ChatLogServiceImpl(ChatLogRepository chatLogRepository) {
        this.chatLogRepository = chatLogRepository;
    }

    @Override
    public void saveChatLog(long chatRoomId, String userInput, String responseSentences,
                            List<ChatApiResponse.AnswerSentence> answerSentences, long userId) {
        ChatLog chatLog = new ChatLog();
        chatLog.setChatRoomId(chatRoomId);
        chatLog.setUserId(userId);
        chatLog.setQuestion(userInput);

        // Convert Flask's answer sentences to ChatLog answer sentences
        List<ChatLog.AnswerSentence> logSentences = answerSentences.stream()
                .map(s -> new ChatLog.AnswerSentence(s.getSentenceId(), s.getContent()))
                .collect(Collectors.toList());

        chatLog.setAnswerSentences(logSentences);
        chatLog.setCreateAT(LocalDateTime.now());
        chatLog.setProcessed(false);

        chatLogRepository.save(chatLog);
    }
    @Override
    public List<ChatLog> getMessagesByChatRoomId(long chatRoomId) {
        return chatLogRepository.findByChatRoomId(chatRoomId); // chatRoomId로 조회
    }
}
