package com.swissclassic.mindflow_server.account.dataclass;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 유저 모델 정의.
 * <p>
 * 이 클래스는 데이터베이스의 {@code users} 테이블과 매핑되며, 사용자 정보를 저장하고 관리합니다.
 * 사용자는 계정 ID, 사용자명, 비밀번호, 이메일 등 다양한 속성을 가지고 있으며,
 * 소셜 로그인 제공자 정보와 잔액 정보도 포함됩니다.
 * </p>
 *
 * <p>
 * 주요 기능:
 * <ul>
 *   <li>사용자 정보의 생성, 조회, 수정, 삭제</li>
 *   <li>리프레시 토큰 관리</li>
 *   <li>사용자 잔액 관리</li>
 * </ul>
 * </p>
 *
 * @author KangMin Lee
 * @version 1.0
 * @since 2025-01-31
 */
@Entity
@Getter
@Setter
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String accountId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 100)
    private String displayName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 255)
    private String refreshToken;

    public User() {
    }

    public User(
            Long id, String accountId, String username, String password, String displayName, String email,
            LocalDateTime createdAt, String refreshToken
    ) {
        this.id = id;
        this.accountId = accountId;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.email = email;
        this.createdAt = createdAt;
        this.refreshToken = refreshToken;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", accountId='" + accountId + '\'' +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", displayName='" + displayName + '\'' +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                ", refreshToken='" + refreshToken +
                '}';
    }
}