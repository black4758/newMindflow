package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;


@Getter
@ToString
@Document(collection = "chat_logs")
@NoArgsConstructor // 파라미터가 없는 기본 생성자를 자동으로 만들어줍니다.
@AllArgsConstructor // 모든 필드를 파라미터로 받는 생성자를 자동으로 만들어줍니다.
@Builder
public class ChatLog {
    @Id
    @Field("id")
    private String id;

    @Field("account_id")
    private String accountId;

    @Field("chat_room_id")
    private Long chatRoomId;

//    private String topic;
//    private List<Double> embedding;

    @Field("created_at")
    private String createdAt;  // Date 대신 LocalDateTime 사용

    private String question;

    @Field("answer_sentences")
    private List<AnswerSentence> answerSentences;


    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerSentence {

        @Field("sentence_id")
        private String sentenceId;
        private String content;
        @Field("is_deleted")
        private boolean isDeleted;
    }

}




/*
* @Getter
@Document(collection = "chat_logs")
public class ChatLog {
    private ObjectId id;              // MongoDB _id field
    private Long user_id;             // Foreign key to User.id
    private Long chat_room_id;        // Foreign key to ChatRoom.id
    private Long model_id;            // Foreign key to ModelVersion.id
    private String topic;             // Optional
    private List<Double> embedding;   // Optional
    private String question;
    private Date created_at;
    private List<Sentence> sentences; // List of Sentence objects

    // Default constructor (required for MongoDB deserialization)
    public ChatLog() {
    }

    // Parameterized constructor
    public ChatLog(ObjectId id, long user_id, long chat_room_id, String topic, long model_id,
                   List<Double> embedding, String question, Date created_at, List<Sentence> sentences) {
        this.id = id;
        this.user_id = user_id;
        this.chat_room_id = chat_room_id;
        this.topic = topic;
        this.model_id = model_id;
        this.embedding = embedding;
        this.question = question;
        this.created_at = created_at;
        this.sentences = sentences;
    }

    // toString method for debugging
    @Override
    public String toString() {
        return "Conversation{" +
                "id=" + id +
                ", user_id=" + user_id +
                ", chat_room_id=" + chat_room_id +
                ", topic='" + topic + '\'' +
                ", model_id=" + model_id +
                ", embedding=" + embedding +
                ", question='" + question + '\'' +
                ", created_at=" + created_at +
                ", sentences=" + sentences +
                '}';
    }
}
* */