package com.swissclassic.mindflow_server.account.controller;

import com.swissclassic.mindflow_server.account.model.dto.EditUserProfileRequest;
import com.swissclassic.mindflow_server.account.model.dto.UserProfileResponse;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import com.swissclassic.mindflow_server.account.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import org.apache.commons.lang3.NotImplementedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/profiles/{userId}")
    @Operation(summary = "프로필 조회", description = "사용자의 userId에 따라 프로필을 조회합니다.")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("User not authenticated.");
        }
        UserProfileResponse userProfileResponse = new UserProfileResponse(
                user.getAccountId(), user.getEmail(), user.getUsername(), user.getDisplayName());

        return ResponseEntity.status(HttpStatus.OK)
                             .body(userProfileResponse);
    }

    @PostMapping("/profiles/{userId}/patch")
    @Operation(summary = "프로필 수정", description = "사용자의 userId에 따라 프로필을 수정합니다.")
    public ResponseEntity<?> editUserProfile(
            @PathVariable Long userId, @RequestBody EditUserProfileRequest editUserProfileRequest
    ) {
        User user = userRepository.findById(userId)
                                  .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("User not authenticated.");
        }
        user.setAccountId(editUserProfileRequest.getAccountId());
        user.setUsername(editUserProfileRequest.getUsername());
        user.setDisplayName(editUserProfileRequest.getDisplayName());
        user.setPassword(passwordEncoder.encode(editUserProfileRequest.getPassword()));
        user.setEmail(editUserProfileRequest.getEmail());
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.OK)
                             .body("Changed profile successfully.");
    }
}
