package com.swasthyasaathi.chat;

import com.swasthyasaathi.auth.JwtUtil;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.ProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT, properties = {"server.port=8085"})
@ActiveProfiles("test")
public class ChatLoadBenchmarkTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ProfileRepository profileRepository;

    @MockBean
    private GeminiClient geminiClient;

    @MockBean
    private RagService ragService;

    @Test
    @DisplayName("Experiment B: k6 Load Test at 10, 50, 100 Virtual Users against Mocked Gemini Pipeline")
    void testK6Load() throws Exception {
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenAnswer(inv -> "I am here to listen and help you through this difficult moment.");

        when(ragService.retrieveRelevantChunks(anyString(), anyDouble(), anyInt()))
                .thenReturn(List.of(
                        KnowledgeChunk.builder()
                                .id(UUID.randomUUID())
                                .title("Stress Relief Techniques")
                                .category("Coping")
                                .content("Try 4-7-8 breathing or progressive relaxation.")
                                .source("seed_knowledge")
                                .build()
                ));

        // Generate 100 dedicated profiles & tokens (1 per VU) to evaluate multi-user concurrency
        List<String> tokens = new ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            Profile p = profileRepository.save(Profile.builder()
                    .id(UUID.randomUUID())
                    .email("k6_user_" + i + "@test.com")
                    .name("K6 User " + i)
                    .passwordHash("k6_hash")
                    .build());
            tokens.add(jwtUtil.generateToken(new UserPrincipal(p)));
        }

        String tokenListJoined = String.join(",", tokens);

        Path k6ScriptPath = Paths.get("..", "metrics", "k6_chat.js").toAbsolutePath().normalize();
        if (!Files.exists(k6ScriptPath)) {
            k6ScriptPath = Paths.get("metrics", "k6_chat.js").toAbsolutePath().normalize();
        }

        List<String> reportLines = new ArrayList<>();
        reportLines.add("==========================================================================================");
        reportLines.add("EXPERIMENT B: K6 CONCURRENCY & LOAD BENCHMARK (MOCKED GEMINI PIPELINE)");
        reportLines.add("Date: " + new Date());
        reportLines.add("Target: http://localhost:8085/api/chat");
        reportLines.add("Hardware/Env: Local Windows machine, OpenJDK 21 Temurin, Spring Boot, k6 v2.0.0");
        reportLines.add("==========================================================================================");

        int[] vuLevels = {10, 50, 100};

        for (int vus : vuLevels) {
            reportLines.add(String.format("\n--- RUNNING K6 LOAD TEST: %d VIRTUAL USERS (DURATION: 10s) ---", vus));
            ProcessBuilder pb = new ProcessBuilder(
                    "k6.exe", "run",
                    "--vus", String.valueOf(vus),
                    "--duration", "10s",
                    k6ScriptPath.toString()
            );
            pb.environment().put("TARGET_URL", "http://localhost:8085");
            pb.environment().put("TOKENS", tokenListJoined);
            pb.redirectErrorStream(true);

            Process proc = pb.start();
            StringBuilder k6Output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    k6Output.append(line).append("\n");
                    System.out.println("[k6-" + vus + "] " + line);
                }
            }
            int exitCode = proc.waitFor();
            reportLines.add("Exit Code: " + exitCode);
            reportLines.add("Raw k6 Output:");
            reportLines.add(k6Output.toString());
            reportLines.add("------------------------------------------------------------------------------------------");
            Thread.sleep(1000); // cooldown between runs
        }

        reportLines.add("\nSTREAMING TIME-TO-FIRST-BYTE (TTFB) FOR CHAT PIPELINE:");
        reportLines.add("  Status: NOT MEASURED - Backend does not implement Server-Sent Events (SSE) or chunked HTTP streaming.");
        reportLines.add("  Backend Endpoint Architecture: Synchronous JSON POST returning full ChatResponse.");
        reportLines.add("  See metrics/raw/gemini_ttft_raw.txt for upstream Google Gemini API live streaming TTFT.");
        reportLines.add("==========================================================================================");

        Path rawDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawDir)) {
            rawDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawDir);
        Files.write(rawDir.resolve("k6_load_raw.txt"), reportLines);
        System.out.println("k6 Load Benchmark completed! Saved to k6_load_raw.txt");
    }
}
