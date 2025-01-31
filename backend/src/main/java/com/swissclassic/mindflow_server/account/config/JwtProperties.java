package com.swissclassic.mindflow_server.account.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for JWT.
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * Secret key used for signing JWTs.
     */
    private String secret;

    /**
     * JWT token expiration time in milliseconds.
     */
    private long expirationMs;
}
