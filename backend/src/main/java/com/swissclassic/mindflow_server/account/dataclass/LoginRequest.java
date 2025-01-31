package com.swissclassic.mindflow_server.account.dataclass;

import lombok.Data;

/**
 * DTO for user login requests.
 */
@Data
public class LoginRequest {
    private String username;

    private String password;
}
