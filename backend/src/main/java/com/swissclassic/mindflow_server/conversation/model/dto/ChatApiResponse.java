package com.swissclassic.mindflow_server.conversation.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder

public class ChatApiResponse {
    @JsonProperty("chat_room_id")
    private Long chatRoomId; // "chat_room_id" 필드 매핑
    private String model; // "model" 필드 매핑
    @JsonProperty("detail_model")
    private String detailModel; // "detail_model" 필드 매핑
    private String response; // "response" 필드 매핑
}