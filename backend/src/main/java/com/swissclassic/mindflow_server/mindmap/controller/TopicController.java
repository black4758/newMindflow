package com.swissclassic.mindflow_server.mindmap.controller;

import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mindmaps")
@Tag(name="MindMap API", description = "마인드맵 관련 API 입니다.")
public class TopicController {

    @Autowired
    private TopicService topicService;

    @GetMapping("/{userId}")
    @Operation(summary = "유저 전체 마인드맵 조회", description = "accountId 입력하세요")
    public TopicDTO getTopicByUserId(@PathVariable String userId) {
        return topicService.getTopicByUserId(userId);
    }

    @GetMapping("/{userId}/{chatRoomId}")
    @Operation(summary = "유저의 해당 채팅방 마인드맵 조회", description = "accountId, chatRoomId 입력")
    public TopicDTO getTopicByUserIdAndChatRoom(
            @PathVariable String userId,
            @PathVariable String chatRoomId) {

        return topicService.getMindMapByUserAndChatRoom(userId, chatRoomId);
    }
}