package com.swissclassic.mindflow_server.account.controller;

import com.swissclassic.mindflow_server.account.model.dto.*;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import com.swissclassic.mindflow_server.account.service.PasswordResetService;
import com.swissclassic.mindflow_server.util.JwtUtils;
import com.swissclassic.mindflow_server.account.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.Getter;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication-related endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "회원 가입, 로그인 관련 API")
public class AuthenticationController {
    @Autowired
    private UserService userService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Endpoint for user registration.
     *
     * @param registerRequest the registration request containing user details
     * @return a ResponseEntity with a success or error message
     */
    @PostMapping("/register")
    @Operation(summary = "회원 가입", description = "사용자의 정보를 받아 회원가입을 진행합니다.")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.registerUser(registerRequest);
            return ResponseEntity.ok("User registered successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                                 .body("Error: " + e.getMessage());
        }
    }

    /**
     * Endpoint for user login.
     *
     * @param loginRequest the login request containing username and password
     * @return a ResponseEntity with a JWT token or error message
     */
    @PostMapping("/login")
    @Operation(summary = "로그인", description = "계정 ID와 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.")
    @ApiResponses(value = {@ApiResponse(responseCode = "200", description = "로그인 성공"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "400", description = "잘못된 요청")})
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getAccountId(), loginRequest.getPassword()));

            User user = userRepository.findByAccountId(loginRequest.getAccountId())
                                      .orElse(null);
            if (user == null) {
                throw new BadCredentialsException("");
            }


            // Set the authentication in the security context
            SecurityContextHolder.getContext()
                                 .setAuthentication(authentication);

            // Generate JWT token
            String accessToken = jwtUtils.generateJwtToken(loginRequest.getAccountId());
            String refreshToken = jwtUtils.generateRefreshToken(user.getId()
                                                                    .toString());

            user.setRefreshToken(refreshToken);
            userRepository.save(user);


            // Return the JWT in the response
            return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid username or password.");
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "사용자의 로그아웃을 처리하고 토큰을 무효화합니다.")
    public ResponseEntity<?> logout(@RequestBody Long userId) {
        Authentication auth = SecurityContextHolder.getContext()
                                                   .getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("User not authenticated.");
        }
        // 세션 토큰 날리기
        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid user id.");
        }
        user.setRefreshToken(null);
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.OK)
                             .body("Logged out successfully.");
    }

    @DeleteMapping("/delete/{userId}")
    @Operation(summary = "회원 탈퇴 (일부 구현됨)", description = "사용자 계정을 삭제합니다. 관련된 모든 데이터가 삭제됩니다.")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        // 계정 아이디 찾기
        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid user id.");
        }
        // 계정 정보 삭제
        userRepository.delete(user);
        // TODO: mongodb 삭제
        // TODO: neo4j 삭제

        return ResponseEntity.status(HttpStatus.OK)
                             .body("Deleting account successful.");
    }

    @PostMapping("/find-id")
    @Operation(summary = "계정 ID 찾기", description = "사용자의 이름과 이메일을 통해 계정 ID를 찾습니다.")
    public ResponseEntity<?> findAccountId(@RequestBody FindAccountIdRequest findAccountIdRequest) {
        String name = findAccountIdRequest.getName();
        String email = findAccountIdRequest.getEmail();

        // 이름과 이메일의 존재 여부 확인
        User user = userRepository.findByUsername(name)
                                  .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid username.");
        }
        if (!user.getEmail()
                 .equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("User name and email does not match.");
        }
        return ResponseEntity.status(HttpStatus.OK)
                             .body(user.getAccountId());
    }

    @PostMapping("/account-verification")
    @Operation(summary = "계정 확인", description = "계정 ID와 이메일을 통해 사용자 계정의 존재 여부를 확인합니다.")
    public ResponseEntity<?> verifyAccount(@RequestBody AccountVerificationRequest accountVerificationRequest) {
        String accountId = accountVerificationRequest.getAccountId();
        String email = accountVerificationRequest.getEmail();
        User user = userRepository.findByAccountId(accountId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid account id.");
        }
        if (!user.getEmail()
                 .equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Account id and email does not match.");
        }

        passwordResetService.initiatePasswordReset(accountId, email);
        return ResponseEntity.status(HttpStatus.OK)
                             .body("Token is valid.");
    }

    @PostMapping("/token-verification")
    @Operation(summary = "토큰 검증", description = "비밀번호 재설정 등에 사용되는 임시 토큰의 유효성을 검증합니다.")
    public ResponseEntity<?> verifyToken(@RequestBody TokenVerificationRequest tokenVerificationRequest) {
        String accountId = tokenVerificationRequest.getAccountId();
        String token = tokenVerificationRequest.getToken();
        if (passwordResetService.verifyToken(accountId, token)) {
            return ResponseEntity.status(HttpStatus.OK)
                                 .body("Token is valid.");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Incorrect Token.");
        }
    }

    @PatchMapping("/reset-password")
    @Operation(summary = "비밀번호 재설정", description = "토큰 검증 후 새로운 비밀번호로 재설정합니다.")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        String accountId = resetPasswordRequest.getAccountId();
        String token = resetPasswordRequest.getToken();
        String newPassword = resetPasswordRequest.getNewPassword();
        boolean success = passwordResetService.resetPassword(accountId, token, newPassword);
        if (success) {
            return ResponseEntity.ok("Password reset successful.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("Password reset failed. Invalid token or account id.");
        }
    }

    /**
     * Response object containing the JWT token.
     */
    @Getter
    static class JwtResponse {
        private final String token;
        private final String type = "Bearer";

        public JwtResponse(String token) {
            this.token = token;
        }

    }
}
