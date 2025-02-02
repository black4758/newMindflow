package com.swissclassic.mindflow_server.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import javax.annotation.PostConstruct;

@Configuration
@EnableMongoRepositories(basePackages = "com.swissclassic.mindflow_server.conversation.repository")
@Slf4j
public class MongoConfig {

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDbFactory) {
        return new MongoTemplate(mongoDbFactory);
    }

    @PostConstruct
    public void checkMongoConnection() {
        try {
            MongoClient mongoClient = MongoClients.create("mongodb://localhost:27017");
            MongoDatabase database = mongoClient.getDatabase("mindflow_db");  // DB 이름 수정
            database.runCommand(new Document("ping", 1));
            log.info("MongoDB 연결 성공");
        } catch (Exception e) {
            log.error("MongoDB 연결 실패: ", e);
        }
    }
}