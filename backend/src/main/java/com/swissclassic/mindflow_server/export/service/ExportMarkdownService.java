package com.swissclassic.mindflow_server.export.service;

import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
import com.swissclassic.mindflow_server.conversation.repository.LlmProvidersRepository;
import com.swissclassic.mindflow_server.conversation.repository.ModelVersionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ExportMarkdownService {
    @Autowired
    private ChatLogRepository chatLogRepository;
    @Autowired
    private ModelVersionRepository modelVersionRepository;
    @Autowired
    private LlmProvidersRepository llmProvidersRepository;

    public String exportChatToMarkdown(Long chatRoomId) {
        List<ChatLog> chatLogs = chatLogRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoomId);
        if (chatLogs.isEmpty()){
            return "No chats available";
        }
        StringBuilder markdown = new StringBuilder();

        // Add title
        markdown.append("# Chat Log\n\n");
        markdown.append("*Exported on: ")
                .append(LocalDateTime.now())
                .append("*\n\n");

        // Add messages
        for (ChatLog log : chatLogs) {
            // Add timestamp
            markdown.append("## ")
                    .append(log.getCreatedAt()
                               .format(
                                       DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                               ))
                    .append("\n");

            String modelSpecificName = modelVersionRepository.findFirstById(log.getModelVersionId())
                                                             .getName();
            long llmProviderId = modelVersionRepository.findFirstById(log.getModelVersionId())
                                                       .getProviderId();
            String providerName = llmProvidersRepository.findFirstById(llmProviderId)
                                                        .getName();
            List<ChatLog.AnswerSentence> sentences = log.getAnswerSentences();

            markdown.append("**User:**\n");
            // Add content
            markdown.append(log.getQuestion())
                    .append("\n");
            markdown.append("---\n");
            markdown.append("**AI (")
                    .append(providerName)
                    .append(" ")
                    .append(modelSpecificName)
                    .append("):**\n");
            String content = sentences.stream()
                                      .map(ChatLog.AnswerSentence::getContent)
                                      .filter(str -> str != null && !str.trim()
                                                                        .isEmpty())
                                      .collect(Collectors.joining(" "));
            markdown.append(content)
                    .append("\n");
            // Add separator
            markdown.append("---\n");
        }

        return markdown.toString();
    }
}
