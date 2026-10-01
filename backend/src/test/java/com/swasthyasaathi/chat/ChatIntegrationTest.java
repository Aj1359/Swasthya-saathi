package com.swasthyasaathi.chat;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.repository.KnowledgeChunkRepository;
import com.swasthyasaathi.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ChatIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private KnowledgeChunkRepository knowledgeChunkRepository;

    @MockBean
    private GeminiClient geminiClient;

    @BeforeEach
    void setUp() {
        knowledgeChunkRepository.deleteAll();

        // Seed grounding knowledge chunk
        KnowledgeChunk chunk = KnowledgeChunk.builder()
                .source("CBT Guide")
                .title("Deep Breathing")
                .content("Inhale deeply for 4 seconds, hold for 4 seconds, exhale for 4 seconds.")
                .build();
        knowledgeChunkRepository.save(chunk);
    }

    @Test
    @WithMockUser
    @DisplayName("Integration Test: Full End-to-End Chat Flow (HTTP -> Controller -> RateLimit -> Safety -> RAG -> Gemini -> Response)")
    void testFullChatIntegrationFlow() throws Exception {
        float[] mockVector = new float[768];
        when(geminiClient.embedContent(anyString())).thenReturn(mockVector);
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenReturn("Hello! Try taking a deep breath using the 4-4-4 box breathing technique.");

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\n" +
                                "  \"content\": \"I am feeling anxious about exams\",\n" +
                                "  \"sessionId\": \"integration-session-101\"\n" +
                                "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Hello! Try taking a deep breath using the 4-4-4 box breathing technique."))
                .andExpect(jsonPath("$.sessionId").value("integration-session-101"))
                .andExpect(jsonPath("$.crisisFlag").value(false))
                .andExpect(jsonPath("$.intent").value("EMOTIONAL_SUPPORT"));
    }

    @Test
    @WithMockUser
    @DisplayName("Integration Test: Isolated CRISIS Flow Bypasses LLM Generation")
    void testCrisisIntegrationFlow() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\n" +
                                "  \"content\": \"I want to end my life\",\n" +
                                "  \"sessionId\": \"crisis-session-202\"\n" +
                                "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crisisFlag").value(true))
                .andExpect(jsonPath("$.intent").value("CRISIS"))
                .andExpect(jsonPath("$.reply").value(org.hamcrest.Matchers.containsString("14416")));
    }
}
