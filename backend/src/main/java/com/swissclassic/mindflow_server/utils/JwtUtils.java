package com.swissclassic.mindflow_server.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.swissclassic.mindflow_server.config.JwtProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Utility class for handling JWT operations.
 */
@Component
public class JwtUtils {

    private final JwtProperties jwtProperties;

    @Autowired
    public JwtUtils(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(jwtProperties.getSecret()
                                              .getBytes());
    }

    /**
     * Generates a JWT token for the given username.
     *
     * @param username the username for which the token is generated
     * @return the generated JWT token
     */
    public String generateJwtToken(String username) {
        return JWT.create()
                  .withSubject(username)
                  .withIssuedAt(new Date())
                  .withExpiresAt(new Date(System.currentTimeMillis() + jwtProperties.getExpirationMs()))
                  .sign(getAlgorithm());
    }

    /**
     * Validates the given JWT token.
     *
     * @param token the JWT token to validate
     * @return the decoded JWT if valid
     * @throws Exception if the token is invalid or expired
     */
    public DecodedJWT validateJwtToken(String token) throws Exception {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                                      .build();
            return verifier.verify(token);
        } catch (Exception e) {
            throw new Exception("Invalid JWT token");
        }
    }

    /**
     * Extracts the username (subject) from the JWT token.
     *
     * @param token the JWT token
     * @return the username
     */
    public String getUsernameFromJwtToken(String token) {
        DecodedJWT decodedJWT = JWT.decode(token);
        return decodedJWT.getSubject();
    }
}
