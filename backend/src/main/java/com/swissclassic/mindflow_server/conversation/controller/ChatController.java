package com.swissclassic.mindflow_server.conversation.controller;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatResponse;
import com.swissclassic.mindflow_server.conversation.service.AiServerService;
import com.swissclassic.mindflow_server.conversation.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "채팅 관련 API")
public class ChatController {
    private final AiServerService aiServerService;
    @Operation(
            summary = "새로운 채팅 메시지 전송",
            description = "사용자의 질문을 받아 AI 응답을 생성하고, 마인드맵을 업데이트합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "채팅 처리 성공"
    )
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiServerService.processChat(request));
    }


//    @Operation(
//            summary = "채팅방 대화 내역 조회",
//            description = "특정 채팅방의 모든 대화 내역을 조회합니다."
//    )
//    @GetMapping("/room/{accountId}/{roomId}")
//    public ResponseEntity<List<ChatResponse>> getChatsByRoom(
//            @PathVariable String accountId,
//            @PathVariable Long roomId) {
//        return ResponseEntity.ok(chatService.getChatsByRoom(accountId, roomId));
//    }
//    @Operation(
//            summary = "사용자 대화 내역 조회",
//            description = "특정 사용자의 모든 대화 내역을 조회합니다."
//    )
//    @GetMapping("/account/{accountId}")
//    public ResponseEntity<List<ChatResponse>> getChatsByAccount(
//            @PathVariable String accountId) {
//        return ResponseEntity.ok(chatService.getChatsByAccount(accountId));
//    }
}