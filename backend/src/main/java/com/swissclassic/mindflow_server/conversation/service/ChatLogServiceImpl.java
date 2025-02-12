package com.swissclassic.mindflow_server.conversation.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatLogServiceImpl implements ChatLogService{

    private final ChatLogRepository chatLogRepository;

    @Autowired

    public  ChatLogServiceImpl(ChatLogRepository chatLogRepository) {
        this.chatLogRepository = chatLogRepository;
    }

    @Override
    public void saveChatLog(long chatRoomId, String userInput, String responseSentences,String llmProviders,String modelVersion, long userId) {
        // 응답 문장을 AnswerSentence 객체 리스트로 변환
        String[] lines = responseSentences.split("\n");
        List<ChatLog.AnswerSentence> answerSentences = new ArrayList<>();
        for (String line : lines) {
            line = line.trim();
            System.out.println(line);
            if (!line.isEmpty()) {
                answerSentences.add(new ChatLog.AnswerSentence(line));
            }
        }

        // 대화 로그 Document 생성
        ChatLog chatLog = new ChatLog();
        chatLog.setChatRoomId(chatRoomId);
        chatLog.setUserId(userId);
        chatLog.setQuestion(userInput);
        chatLog.setAnswerSentences(answerSentences);
        chatLog.setLlmProviders(llmProviders);
        chatLog.setModelVersion(modelVersion);
        chatLog.setCreateAT(LocalDateTime.now());
        chatLog.setProcessed(false);

        // MongoDB에 저장
        chatLogRepository.save(chatLog);



    }
    @Override
    public List<ChatLog> getMessagesByChatRoomId(long chatRoomId) {
        return chatLogRepository.findByChatRoomId(chatRoomId); // chatRoomId로 조회
    }

    @Override
    public  List<ChatLog> findBySentenceContent(String searchKeyword){
        return chatLogRepository.findBySentenceContent(searchKeyword);
    }

    @Override
    public void deleteChatLogsByChatRoomId(long chatRoomId) {
        chatLogRepository.deleteByChatRoomId(chatRoomId);
    }
}
