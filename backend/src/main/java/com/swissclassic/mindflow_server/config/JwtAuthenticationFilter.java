package com.swissclassic.mindflow_server.config;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.swissclassic.mindflow_server.account.service.CustomUserDetailsService;
import com.swissclassic.mindflow_server.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter for JWT authentication.
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    /**
     * Filters each incoming request to check for a valid JWT token.
     *
     * @param request     the HTTP request
     * @param response    the HTTP response
     * @param filterChain the filter chain
     * @throws ServletException in case of servlet errors
     * @throws IOException      in case of I/O errors
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        if (requestURI.startsWith("/swagger-ui") ||
                requestURI.startsWith("/v3/api-docs") ||
                requestURI.startsWith("/swagger-resources") ||
                requestURI.startsWith("/webjars")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            // Extract JWT token from the Authorization header
            String jwt = parseJwt(request);
            log.debug("1. JWT token: " + jwt);  // Check if token exists
            if (jwt != null) {
                // Validate the token
                DecodedJWT decodedJWT = jwtUtils.validateJwtToken(jwt);
                String accountId = decodedJWT.getSubject();
                log.debug("2. Decoded accountId: " + accountId);  // Check subject


                // Load user details from the database
                UserDetails userDetails = userDetailsService.loadUserByUsername(accountId);
                log.debug("3. Loaded userDetails username: " + userDetails.getUsername());  // Check loaded user

                // Create authentication token
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                log.debug("4. Created authentication token");  // Check authentication creation

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication in the security context
                SecurityContextHolder.getContext()
                                     .setAuthentication(authentication);
                log.debug("5. Set authentication in SecurityContext");  // Check security context

            }
        } catch (Exception e) {
            // Logging can be added here for debugging
            log.error("Cannot set user authentication: " + e.getMessage());
        }

        // Proceed with the next filter in the chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extracts the JWT token from the Authorization header.
     *
     * @param request the HTTP request
     * @return the JWT token or null if not found
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        // JWT token is expected to be in the format "Bearer <token>"
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7); // Extract the token without "Bearer "
        }

        return null;
    }
}
