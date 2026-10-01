package com.swasthyasaathi.security;

import com.swasthyasaathi.auth.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Security 1: Unauthenticated Request to Protected Endpoint returns 401/403")
    void testUnauthenticatedRequest() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\": \"Hello\", \"sessionId\": \"session-1\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security 2: Request with Malformed JWT Token returns 401/403")
    void testInvalidJwtToken() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .header("Authorization", "Bearer invalid.jwt.token.string")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\": \"Hello\", \"sessionId\": \"session-1\"}"))
                .andExpect(status().isForbidden());
    }
}
