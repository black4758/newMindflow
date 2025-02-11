package com.swissclassic.mindflow_server.mindmap.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.repository.ChatRoomReferenceRepository;
import com.swissclassic.mindflow_server.mindmap.repository.TopicRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TopicService {

    private final ChatRoomService chatRoomService;
    private final ChatLogService chatLogService;
    private final TopicRepository topicRepository;
    private final ChatRoomReferenceRepository chatRoomReferenceRepository;

    @Autowired
    public TopicService(ChatRoomService chatRoomService,
                        ChatLogService chatLogService,
                        TopicRepository topicRepository,
                        ChatRoomReferenceRepository chatRoomReferenceRepository) {
        this.chatRoomService = chatRoomService;
        this.chatLogService = chatLogService;
        this.topicRepository = topicRepository;
        this.chatRoomReferenceRepository = chatRoomReferenceRepository;
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

    public void seperateTopic(String elementId) {

        // 1. 노드 정보 가져오기
        Map<String, Object> result = topicRepository.getSeparatedTopicData(elementId);

        if (result == null) {
            throw new EntityNotFoundException("Node not found with ID: " + elementId);
        }

        // 2. 루트 노드 정보 추출
        Map<String, Object> rootNodeData = (Map<String, Object>) result.get("rootNode");
        String accountId = (String) rootNodeData.get("accountId");
        String content = (String) rootNodeData.get("content");
        String originalChatRoomId = (String) rootNodeData.get("chatRoomId");

        // 3. 새로운 채팅방 생성
        String newTitle = chatRoomService.getTitle(content);
        ChatRoom newChatRoom = chatRoomService.createChatRoom(
                newTitle,
                Long.parseLong(accountId)
        );

        // 4. 모든 노드의 대화 내용을 새 채팅방으로 복사
        List<Map<String, Object>> nodesData = (List<Map<String, Object>>) result.get("nodes");
        for (Map<String, Object> nodeData : nodesData) {
            String mongoRef = (String) nodeData.get("mongoRef");
            if (mongoRef != null) {
                ChatLog originalLog = chatLogService.findBySentenceId(mongoRef);
                if (originalLog != null) {
                    chatLogService.saveChatLog(
                            newChatRoom.getId(),
                            originalLog.getQuestion(),
                            originalLog.getAnswerSentences(),
                            Long.parseLong(accountId)
                    );
                }
            }
        }

        // 5. 채팅방 참조 정보 저장
        ChatRoomReference reference = ChatRoomReference.builder()
                .originalChatRoomId(originalChatRoomId)
                .newChatRoomId(newChatRoom.getId())
                .separationNodeId(elementId)
                .createdAt(LocalDateTime.now())
                .build();
        chatRoomReferenceRepository.save(reference);
    }

}