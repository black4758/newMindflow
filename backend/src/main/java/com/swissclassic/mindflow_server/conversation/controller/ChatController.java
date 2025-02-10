package com.swissclassic.mindflow_server.conversation.controller;

import com.swissclassic.mindflow_server.conversation.model.dto.*;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import com.swissclassic.mindflow_server.conversation.service.AiServerService;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import com.swissclassic.mindflow_server.conversation.service.ConversationSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/messages")
@Tag(name = "send", description = "채팅 관련 API")
public class ChatController {
    private final AiServerService aiServerService;
    private final ChatRoomService roomService;
    private final ChatLogService chatLogService;
    private final ConversationSummaryService conversationSummaryService;


    @PostMapping("/send")
    @Operation(description = "gemini-2.0-flash-exp")
    public ChatApiResponse getChatResponse(@RequestBody ChatRequest chatRequest) {
        ChatApiResponse answer = aiServerService.getChatResponse(chatRequest);

        chatLogService.saveChatLog(
                (chatRequest.getChatRoomId()),
                chatRequest.getUserInput(),
                answer.getResponse(),
                (chatRequest.getCreatorId())
        );

        return answer;
    }

    @PostMapping("/all")
    public ChatAllResponse getAllResponse(@RequestBody ChatAllRequest chatRequest) {
        return aiServerService.getAllChatResponse(chatRequest);
    }

    @PostMapping("/choiceModel")
    FirstChatRespose firstChat(@RequestBody ConversationSummaryRequest conversationSummaryRequest) {
        ChatRoom room = roomService.createChatRoom(roomService.getTitle(conversationSummaryRequest.getUserInput()),
                                                   conversationSummaryRequest.getCreatorId());
        long RoomId = (room.getId());
        chatLogService.saveChatLog(
                (RoomId),
                conversationSummaryRequest.getUserInput(),
                conversationSummaryRequest.getAnswer(),
                (conversationSummaryRequest.getCreatorId())
        );
        ConversationSummary conversationSummary = new ConversationSummary();
        conversationSummary.setTimestamp(String.valueOf(Instant.now()));
        conversationSummary.setChatRoomId(RoomId);
        conversationSummary.setSummaryContent(
                "User:" + conversationSummaryRequest.getUserInput() + "\nAI" + conversationSummaryRequest.getAnswer());
        conversationSummaryService.saveConversationSummary(conversationSummary);
        FirstChatRespose firstChatRespose = new FirstChatRespose();
        firstChatRespose.setChatRoomId((RoomId));
        System.out.println(RoomId);
        return firstChatRespose;
    }

}
