package com.swissclassic.mindflow_server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient aiServerWebClient() {
        return WebClient.builder()
                .baseUrl("http://127.0.0.1:5001")  // AI 서버 주소
                .build();
    }
}
