package com.swissclassic.mindflow_server.conversation.dataclass;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "user_id", nullable = false)
    private Long userId;

    private LocalDateTime createdAt;

    private Long delta = 0L;

    @Column(length = 255)
    private String reason = "";

    public Transaction() {
    }

    public Transaction(Long id, Long userId, LocalDateTime createdAt, Long delta, String reason) {
        this.id = id;
        this.userId = userId;
        this.createdAt = createdAt;
        this.delta = delta;
        this.reason = reason;
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id=" + id +
                ", userId=" + userId +
                ", createdAt=" + createdAt +
                ", delta=" + delta +
                ", reason='" + reason + '\'' +
                '}';
    }
}