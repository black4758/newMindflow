// config/SwaggerConfig.java
package com.swissclassic.mindflow_server.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Mindflow API Documentation")
                        .description("마인드맵 생성을 위한 채팅 API")
                        .version("v1.0.0"));
    }
}