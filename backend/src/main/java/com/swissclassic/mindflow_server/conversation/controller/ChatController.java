package com.swissclassic.mindflow_server.conversation.controller;
import com.swissclassic.mindflow_server.conversation.model.dto.ChatRequest;
import com.swissclassic.mindflow_server.conversation.service.AiServerService;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chat", description = "채팅 관련 API")
@Controller
public class ChatController {
    private final AiServerService aiServerService;
    private final ChatRoomService roomService;
    private final ChatLogService chatLogService;

    public ChatController(AiServerService aiServerService, ChatRoomService roomService, ChatLogService chatLogService) {
        this.aiServerService = aiServerService;
        this.roomService = roomService;
        this.chatLogService = chatLogService;
    }

    @PostMapping("/chat")
    public Mono<String> getChatResponse(@RequestBody ChatRequest chatRequest) {
        if (chatRequest.getModel().isEmpty()){
            System.out.println("모델이 비어 있습니다.");
            return aiServerService.getAllChatResponse(chatRequest);
        }
        if (chatRequest.getChatRoomId()==0){
            chatRequest.setChatRoomId(roomService.createChatRoom(roomService.getTitle(chatRequest.getUserInput()),chatRequest.getCreatorId()).getId());
        }
        Mono<String> answer =aiServerService.getChatResponse(chatRequest);
        answer.subscribe(response -> {

            try {
                JSONObject jsonResponse = new JSONObject(response);
                String content = jsonResponse.getJSONObject("response").getString("content");
                chatLogService.saveChatLog(
                        String.valueOf(chatRequest.getChatRoomId()),
                        chatRequest.getUserInput(),
                        content,
                        chatRequest.getModel()
                );
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
        });

        return answer;
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
