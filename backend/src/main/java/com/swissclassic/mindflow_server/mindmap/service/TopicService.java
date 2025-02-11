package com.swissclassic.mindflow_server.mindmap.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;
import com.swissclassic.mindflow_server.mindmap.repository.TopicRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
public class TopicService {

    private final ChatRoomService chatRoomService;
    private final ChatLogService chatLogService;
    private final TopicRepository topicRepository;


    @Autowired
    public TopicService(ChatRoomService chatRoomService,
                        ChatLogService chatLogService,
                        TopicRepository topicRepository) {
        this.chatRoomService = chatRoomService;
        this.chatLogService = chatLogService;
        this.topicRepository = topicRepository;

    }

    public TopicDTO getTopicByUserId(String userId) {
        List<Map<String, Object>> results = topicRepository.getTopicByUserId(userId);

        if (results.isEmpty()) {
            return null;
        }

        Map<String, Object> result = results.get(0);

        TopicDTO dto = new TopicDTO();
        dto.setAccountId((String) result.get("accountId"));
        dto.setNodes((List<TopicDTO.NodeDTO>) result.get("nodes"));
        dto.setRelationships((List<TopicDTO.RelationshipDTO>) result.get("relationships"));

        return dto;
    }

    public TopicDTO getMindMapByUserAndChatRoom(String userId, String chatRoomId) {
        List<Map<String, Object>> results = topicRepository.getMindMapByUserAndChatRoom(userId, chatRoomId);

        if (results.isEmpty()) {
            return null;
        }

        Map<String, Object> result = results.get(0);

        TopicDTO dto = new TopicDTO();
        dto.setAccountId((String) result.get("accountId"));
        dto.setChatRoomId((String) result.get("chatRoomId"));
        dto.setNodes((List<TopicDTO.NodeDTO>) result.get("nodes"));
        dto.setRelationships((List<TopicDTO.RelationshipDTO>) result.get("relationships"));

        return dto;
    }

    public void deleteSubtopics(String elementId) {
        topicRepository.deleteSubtopicsByElementId(elementId);
    }




    // 주제 분리
    @Transactional
    public void seperateTopic(String elementId) {
        // 1. 새로운 채팅방 생성
        ChatRoom newChatRoom = chatRoomService.createChatRoom(
                "Separated Topic", // 임시 제목, 나중에 수정 가능
                1L  // 현재 사용자 ID
        );

        // 2. 토픽 분리 및 chat_room_id 업데이트
        topicRepository.separateTopicAndUpdateChatRoom(
                elementId,
                String.valueOf(newChatRoom.getId())
        );

    }

}