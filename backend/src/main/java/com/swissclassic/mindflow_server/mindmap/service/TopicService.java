package com.swissclassic.mindflow_server.mindmap.service;

import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.repository.TopicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class TopicService {

    @Autowired
    private TopicRepository topicRepository;

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

}