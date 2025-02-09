package com.swissclassic.mindflow_server.conversation.controller;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatRoomResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chatroom")
public class ChatRoomController {
    private final ChatRoomService chatRoomService;
    private final ChatLogService chatLogService;

    @GetMapping("my-rooms/{creatorId}")
    public ResponseEntity<List<ChatRoomResponse>> getChatRoomsByCreatorId(@PathVariable long creatorId) {
        List<ChatRoomResponse> chatRooms = chatRoomService.findAllByCreatorId(creatorId);
        return ResponseEntity.ok(chatRooms);
    }
    @GetMapping("messages/{chatRoomId}")
    public ResponseEntity<List<ChatLog>> getChatLogsByChatRoomId(@PathVariable long chatRoomId) {
        List<ChatLog> chatLogs = chatLogService.getMessagesByChatRoomId(chatRoomId);
        return ResponseEntity.ok(chatLogs); // 200 OK 응답과 함께 데이터 반환
    }
}
