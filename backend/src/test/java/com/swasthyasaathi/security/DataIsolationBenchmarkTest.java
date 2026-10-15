package com.swasthyasaathi.security;

import com.swasthyasaathi.auth.JwtUtil;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.chat.ChatService;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.ChatMessage;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.ChatMessageRepository;
import com.swasthyasaathi.repository.FaceScanRepository;
import com.swasthyasaathi.repository.ProfileRepository;
import com.swasthyasaathi.repository.VoiceMoodScanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DataIsolationBenchmarkTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @MockBean
    private GeminiClient geminiClient;

    @Test
    @DisplayName("Data Isolation: Verify Cross-User Session Scoping and History Leakage")
    void testCrossUserSessionDataIsolation() throws Exception {
        chatMessageRepository.deleteAll();
        profileRepository.deleteAll();

        // 1. Create User A and User B
        Profile userA = profileRepository.save(Profile.builder()
                .email("usera@privacy.test")
                .passwordHash("hashA")
                .name("Alice")
                .build());

        Profile userB = profileRepository.save(Profile.builder()
                .email("userb@privacy.test")
                .passwordHash("hashB")
                .name("Bob")
                .build());

        String tokenA = jwtUtil.generateToken(new UserPrincipal(userA));
        String tokenB = jwtUtil.generateToken(new UserPrincipal(userB));

        String sharedSessionId = "session-leak-vector-42";
        String confidentialUserAMessage = "CONFIDENTIAL_ALICE_SECRET_SYMPTOMS: Panic attacks during midterms";

        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenReturn("Empathetic response from Ruhi");

        // 2. User A chats in sharedSessionId
        mockMvc.perform(post("/api/chat")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\n" +
                                "  \"content\": \"" + confidentialUserAMessage + "\",\n" +
                                "  \"sessionId\": \"" + sharedSessionId + "\"\n" +
                                "}"))
                .andExpect(status().isOk());

        // 3. User B sends a request using the SAME sessionId
        ArgumentCaptor<String> userPromptCaptor = ArgumentCaptor.forClass(String.class);
        reset(geminiClient);
        when(geminiClient.generateContent(anyString(), userPromptCaptor.capture(), anyBoolean()))
                .thenReturn("Hello Bob, I am here.");

        mockMvc.perform(post("/api/chat")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\n" +
                                "  \"content\": \"What did we discuss earlier?\",\n" +
                                "  \"sessionId\": \"" + sharedSessionId + "\"\n" +
                                "}"))
                .andExpect(status().isOk());

        String capturedUserPromptForBob = userPromptCaptor.getValue();

        boolean leakedToPrompt = capturedUserPromptForBob.contains(confidentialUserAMessage);

        List<String> logLines = new ArrayList<>();
        logLines.add(String.format("DATA ISOLATION BENCHMARK AUDIT - %s", new Date()));
        logLines.add("==========================================================================================");
        logLines.add("Scenario: User B attempts to access conversation history from User A's sessionId");
        logLines.add("User A ID: " + userA.getId() + " (" + userA.getEmail() + ")");
        logLines.add("User B ID: " + userB.getId() + " (" + userB.getEmail() + ")");
        logLines.add("Target Session ID: " + sharedSessionId);
        logLines.add("User A Injected Content: \"" + confidentialUserAMessage + "\"");
        logLines.add("------------------------------------------------------------------------------------------");
        logLines.add("Captured Prompt History injected for User B:");
        logLines.add(capturedUserPromptForBob);
        logLines.add("------------------------------------------------------------------------------------------");
        logLines.add("FINDING:");
        if (leakedToPrompt) {
            logLines.add("LEAK CONFIRMED: User A's private messages WERE leaked into User B's LLM prompt context!");
            logLines.add("Root Cause: ChatService.java line 153 queries findTop20BySessionIdOrderByCreatedAtDesc(safeSessionId)");
            logLines.add("without validating that the session belongs exclusively to User B's profile ID.");
        } else {
            logLines.add("NO LEAK DETECTED: Prompt context was properly isolated per user.");
        }
        logLines.add("==========================================================================================");

        Path rawDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawDir)) {
            rawDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawDir);
        Files.write(rawDir.resolve("data_isolation_raw.txt"), logLines);

        System.out.println("Data Isolation Benchmark Finished. Leaked: " + leakedToPrompt);
    }
}
