package com.swissclassic.mindflow_server.service;

import com.swissclassic.mindflow_server.dataclass.User;
import com.swissclassic.mindflow_server.dataclass.RegisterRequest;
import com.swissclassic.mindflow_server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for managing users.
 */
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Registers a new user.
     *
     * @param registerRequest the registration request containing user details
     * @return the registered User
     * @throws Exception if the username or email is already taken
     */
    public User registerUser(RegisterRequest registerRequest) throws Exception {
        // Check if username already exists
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new Exception("Username is already taken.");
        }

        // Check if email already exists
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new Exception("Email is already in use.");
        }

        // Create new User entity
        User user = new User();
        user.setAccountId(registerRequest.getAccountId());
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword())); // Hashing the password
        user.setEmail(registerRequest.getEmail());
        user.setDisplayName(registerRequest.getDisplayName());
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    // Additional methods (e.g., findUserByUsername) can be added as needed
}
