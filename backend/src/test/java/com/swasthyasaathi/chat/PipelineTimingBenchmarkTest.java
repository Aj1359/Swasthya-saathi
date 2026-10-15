package com.swasthyasaathi.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swasthyasaathi.auth.JwtUtil;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.ProfileRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PipelineTimingBenchmarkTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GeminiClient geminiClient;

    @MockBean
    private RagService ragService;

    @Test
    @DisplayName("Experiment A: Pipeline Timing Benchmark via Micrometer Timers and /actuator/metrics")
    void benchmarkPipelineTiming() throws Exception {
        // Setup mock delays to simulate realistic processing times
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenAnswer(invocation -> {
                    Thread.sleep(12); // Simulate 12ms LLM generation
                    return "Here is a supportive, empathetic wellness guidance for you.";
                });

        when(ragService.retrieveRelevantChunks(anyString(), anyDouble(), anyInt()))
                .thenAnswer(invocation -> {
                    Thread.sleep(4); // Simulate 4ms vector DB retrieval
                    return List.of(
                            KnowledgeChunk.builder()
                                    .id(UUID.randomUUID())
                                    .title("Sleep Hygiene Guide")
                                    .category("Wellness")
                                    .content("Establish a consistent sleep schedule and limit screen time.")
                                    .source("seed_knowledge")
                                    .build()
                    );
                });

        // Create 5 profiles to avoid rate limiting (20 requests per profile < 30 req/min limit)
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Profile p = profileRepository.save(Profile.builder()
                    .id(UUID.randomUUID())
                    .email("pipeline_user_" + i + "@test.com")
                    .name("User " + i)
                    .passwordHash("hash")
                    .build());
            tokens.add(jwtUtil.generateToken(new UserPrincipal(p)));
        }

        List<String> testQueries = List.of(
                "How can I manage my exam stress?",
                "I am feeling so sad and lonely today.",
                "Tips for improving sleep and energy.",
                "Can you guide me through a 5-minute breathing exercise?",
                "What should I do when I feel overwhelmed?",
                "I want to die, please help me end it all", // crisis query
                "Feeling dead tired after working 12 hours",
                "How to stay hydrated during summer?",
                "Help me calm down, my heart is racing.",
                "suicide is on my mind, I cannot go on" // crisis query
        );

        int totalRequests = 100;
        int successfulRequests = 0;
        int crisisTriggered = 0;

        for (int i = 0; i < totalRequests; i++) {
            String token = tokens.get(i % tokens.size());
            String query = testQueries.get(i % testQueries.size());
            String sessionId = "timing-session-" + (i % tokens.size());

            String payload = String.format("{\"content\":\"%s\",\"sessionId\":\"%s\"}", query, sessionId);

            MvcResult result = mockMvc.perform(post("/api/chat")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andReturn();

            if (result.getResponse().getStatus() == 200) {
                successfulRequests++;
                String body = result.getResponse().getContentAsString();
                if (body.contains("\"crisisFlag\":true")) {
                    crisisTriggered++;
                }
            }
        }

        // Fetch Metrics from MeterRegistry
        Timer rateLimitTimer = meterRegistry.find("swasthya.pipeline.ratelimit").timer();
        Timer safetyTimer = meterRegistry.find("swasthya.pipeline.safety").timer();
        Timer ragTimer = meterRegistry.find("swasthya.pipeline.rag").timer();
        Timer geminiTimer = meterRegistry.find("swasthya.pipeline.gemini").timer();

        assertNotNull(rateLimitTimer, "Rate limit timer must be registered");
        assertNotNull(safetyTimer, "Safety timer must be registered");
        assertNotNull(ragTimer, "RAG timer must be registered");
        assertNotNull(geminiTimer, "Gemini timer must be registered");

        // Fetch /actuator/metrics endpoints to verify Actuator exposure
        MvcResult rateActuator = mockMvc.perform(get("/actuator/metrics/swasthya.pipeline.ratelimit")).andReturn();
        MvcResult safetyActuator = mockMvc.perform(get("/actuator/metrics/swasthya.pipeline.safety")).andReturn();
        MvcResult ragActuator = mockMvc.perform(get("/actuator/metrics/swasthya.pipeline.rag")).andReturn();
        MvcResult geminiActuator = mockMvc.perform(get("/actuator/metrics/swasthya.pipeline.gemini")).andReturn();

        List<String> logLines = new ArrayList<>();
        logLines.add("==========================================================================================");
        logLines.add("EXPERIMENT A: PIPELINE STAGE TIMING BENCHMARK (MICROMETER & ACTUATOR METRICS)");
        logLines.add("Date: " + new Date());
        logLines.add("Environment: Localhost (Windows 11, OpenJDK 21 Temurin, Spring Boot Actuator 3.3.2)");
        logLines.add("Total Processed Requests: " + totalRequests);
        logLines.add("Successful (HTTP 200): " + successfulRequests);
        logLines.add("Crisis Interceptions (Gemini Bypassed): " + crisisTriggered);
        logLines.add("Standard Synthesis Requests (RAG + Gemini): " + (successfulRequests - crisisTriggered));
        logLines.add("==========================================================================================");
        logLines.add(String.format("%-25s | %-10s | %-15s | %-15s | %-15s", "Pipeline Stage", "Count", "Mean Latency", "Max Latency", "Unit"));
        logLines.add("------------------------------------------------------------------------------------------");

        logLines.add(String.format("%-25s | %-10d | %-15.4f | %-15.4f | ms",
                "1. Rate Limiting",
                rateLimitTimer.count(),
                rateLimitTimer.mean(TimeUnit.MILLISECONDS),
                rateLimitTimer.max(TimeUnit.MILLISECONDS)));

        logLines.add(String.format("%-25s | %-10d | %-15.4f | %-15.4f | ms",
                "2. Safety & Crisis Check",
                safetyTimer.count(),
                safetyTimer.mean(TimeUnit.MILLISECONDS),
                safetyTimer.max(TimeUnit.MILLISECONDS)));

        logLines.add(String.format("%-25s | %-10d | %-15.4f | %-15.4f | ms",
                "3. RAG Retrieval",
                ragTimer.count(),
                ragTimer.mean(TimeUnit.MILLISECONDS),
                ragTimer.max(TimeUnit.MILLISECONDS)));

        logLines.add(String.format("%-25s | %-10d | %-15.4f | %-15.4f | ms",
                "4. Gemini Call (Mocked)",
                geminiTimer.count(),
                geminiTimer.mean(TimeUnit.MILLISECONDS),
                geminiTimer.max(TimeUnit.MILLISECONDS)));

        logLines.add("==========================================================================================");
        logLines.add("ACTUATOR /actuator/metrics RAW ENDPOINT PAYLOADS:");
        logLines.add("--- /actuator/metrics/swasthya.pipeline.ratelimit ---");
        logLines.add(rateActuator.getResponse().getContentAsString());
        logLines.add("--- /actuator/metrics/swasthya.pipeline.safety ---");
        logLines.add(safetyActuator.getResponse().getContentAsString());
        logLines.add("--- /actuator/metrics/swasthya.pipeline.rag ---");
        logLines.add(ragActuator.getResponse().getContentAsString());
        logLines.add("--- /actuator/metrics/swasthya.pipeline.gemini ---");
        logLines.add(geminiActuator.getResponse().getContentAsString());
        logLines.add("==========================================================================================");

        Path rawDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawDir)) {
            rawDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawDir);
        Files.write(rawDir.resolve("pipeline_timing_raw.txt"), logLines);

        System.out.println("Pipeline Timing Benchmark completed successfully. Saved to pipeline_timing_raw.txt");
    }
}
