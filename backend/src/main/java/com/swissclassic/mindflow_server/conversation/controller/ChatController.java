package com.swissclassic.mindflow_server.conversation.controller;
import com.swissclassic.mindflow_server.conversation.model.dto.*;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
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
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        ChatApiResponse answer =aiServerService.getChatResponse(chatRequest);

        log.info("Flask 에서 도착한 Answer Sentences: {}", answer.getAnswerSentences());

        chatLogService.saveChatLog(
                chatRequest.getChatRoomId(),
                chatRequest.getUserInput(),
                answer.getResponse(),
                chatRequest.getModel(),
                chatRequest.getDetailModel(),
                (chatRequest.getCreatorId())
        );
        return answer;
    }
    @PostMapping("/all")
    public ChatAllResponse getAllResponse(@RequestBody ChatAllRequest chatRequest) {
        return aiServerService.getAllChatResponse(chatRequest);
    }

    @PostMapping("/choiceModel")

    FirstChatRespose firstChat(@RequestBody ConversationSummaryRequest  conversationSummaryRequest){
        ChatRoom room =roomService.createChatRoom(roomService.getTitle(conversationSummaryRequest.getUserInput()),conversationSummaryRequest.getCreatorId());
        long RoomId=(room.getId());

        chatLogService.saveChatLog(
                roomId,
                conversationSummaryRequest.getUserInput(),
                conversationSummaryRequest.getAnswer(),
               conversationSummaryRequest.getLlmProviders(),
                conversationSummaryRequest.getModelVersion()
                ,
                (conversationSummaryRequest.getCreatorId())
        );


        ConversationSummary  conversationSummary=new ConversationSummary();
        conversationSummary.setTimestamp(String.valueOf(Instant.now()));
        conversationSummary.setChatRoomId(roomId);
        conversationSummary.setSummaryContent("User:"+conversationSummaryRequest.getUserInput()+"\nAI"+ conversationSummaryRequest.getAnswer());

        conversationSummaryService.saveConversationSummary(conversationSummary);

        FirstChatRespose firstChatRespose = new FirstChatRespose();
        firstChatRespose.setChatRoomId((roomId));

        return firstChatRespose;
    }

}
