package com.swissclassic.mindflow_server.dataclass;

import lombok.Getter;
import lombok.Setter;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Setter
@Getter
@Document(collection = "conversations")
public class Conversation {
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
    public Conversation() {
    }

    // Parameterized constructor
    public Conversation(ObjectId id, long user_id, long chat_room_id, String topic, long model_id,
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