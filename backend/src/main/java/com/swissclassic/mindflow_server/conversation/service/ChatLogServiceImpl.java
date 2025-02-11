package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatApiResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.AnswerSentence;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatLogServiceImpl implements ChatLogService{

    private final ChatLogRepository chatLogRepository;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public  ChatLogServiceImpl(ChatLogRepository chatLogRepository, MongoTemplate mongoTemplate) {
        this.chatLogRepository = chatLogRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void saveChatLog(long chatRoomId, String userInput, String responseSentences,
                            List<ChatApiResponse.AnswerSentence> answerSentences, long userId) {
        ChatLog chatLog = new ChatLog();
        chatLog.setChatRoomId(chatRoomId);
        chatLog.setUserId(userId);
        chatLog.setQuestion(userInput);

        // Convert Flask's answer sentences to ChatLog answer sentences
        List<AnswerSentence> logSentences = answerSentences.stream()
                .map(s -> new AnswerSentence(s.getSentenceId(), s.getContent()))
                .collect(Collectors.toList());

        chatLog.setAnswerSentences(logSentences);
        chatLog.setCreatedAt(LocalDateTime.now());
        chatLog.setProcessed(false);

        chatLogRepository.save(chatLog);
    }
    @Override
    public List<ChatLog> getMessagesByChatRoomId(long chatRoomId) {
        return chatLogRepository.findByChatRoomId(chatRoomId); // chatRoomId로 조회
    }

    @Override
    @Transactional
    public void copyAndUpdateChatLog(String mongoRef, long oldChatRoomId, long newChatRoomId) {
        // MongoDB에서 해당 문서 찾기
        Query query = new Query(Criteria.where("chatRoomId").is(oldChatRoomId)
                .and("answerSentences").elemMatch(Criteria.where("sentenceId").is(mongoRef)));

        ChatLog chatLog = mongoTemplate.findOne(query, ChatLog.class);

        if (chatLog != null) {
            // 문서 복사 및 새로운 chatRoomId 설정
            ChatLog newLog = new ChatLog();
            BeanUtils.copyProperties(chatLog, newLog, "id"); // id 필드 제외하고 복사
            newLog.setChatRoomId(newChatRoomId);

            // 새로운 문서 저장
            chatLogRepository.save(newLog);
        }
    }

}
