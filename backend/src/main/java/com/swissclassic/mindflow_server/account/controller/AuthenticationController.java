package com.swissclassic.mindflow_server.account.controller;

import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.model.dto.LoginRequest;
import com.swissclassic.mindflow_server.account.model.dto.RegisterRequest;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import com.swissclassic.mindflow_server.util.JwtUtils;
import com.swissclassic.mindflow_server.account.service.UserService;
import jakarta.validation.Valid;
import lombok.Getter;
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
public class AuthenticationController {
    @Autowired
    private UserService userService;

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
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getAccountId(),
                                                                                                                       loginRequest.getPassword()
            ));

            // Set the authentication in the security context
            SecurityContextHolder.getContext()
                                 .setAuthentication(authentication);

            // Generate JWT token
            String jwt = jwtUtils.generateJwtToken(loginRequest.getAccountId());

            // Return the JWT in the response
            return ResponseEntity.ok(new JwtResponse(jwt));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid username or password.");
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
