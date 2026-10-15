package com.swasthyasaathi.security;

import com.swasthyasaathi.auth.JwtUtil;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.model.Profile;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthMatrixBenchmarkTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("Auth Matrix: Evaluate Protected Endpoints against 4 Token Failure States")
    void testAuthMatrix() throws Exception {
        // Build test tokens
        Profile testProfile = Profile.builder()
                .id(UUID.randomUUID())
                .email("authmatrix@test.com")
                .name("Matrix Tester")
                .build();
        UserPrincipal principal = new UserPrincipal(testProfile);

        // 1. Valid token
        String validToken = jwtUtil.generateToken(principal);

        // 2. Expired token (signed with valid key but expired in 2020)
        SecretKey validKey = Keys.hmacShaKeyFor("test_jwt_secret_must_be_at_least_32_bytes_long_1234567890_abcdef".getBytes(StandardCharsets.UTF_8));
        String expiredToken = Jwts.builder()
                .subject(testProfile.getEmail())
                .claim("userId", testProfile.getId().toString())
                .issuedAt(new Date(System.currentTimeMillis() - 3600000))
                .expiration(new Date(System.currentTimeMillis() - 1800000))
                .signWith(validKey)
                .compact();

        // 3. Tampered token (valid token with modified character in payload)
        String[] parts = validToken.split("\\.");
        String tamperedPayload = parts[1].substring(0, parts[1].length() - 2) + "==";
        String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

        // 4. Wrong-signature token (signed with an attacker's key)
        SecretKey attackerKey = Keys.hmacShaKeyFor("attacker_malicious_secret_key_must_be_at_least_32_bytes!!".getBytes(StandardCharsets.UTF_8));
        String wrongSignatureToken = Jwts.builder()
                .subject(testProfile.getEmail())
                .claim("userId", testProfile.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 900000))
                .signWith(attackerKey)
                .compact();

        // Target protected endpoints & sample payloads
        Map<String, String> protectedEndpoints = Map.of(
                "/api/chat", "{\"content\":\"Hello\",\"sessionId\":\"auth-matrix-1\"}",
                "/api/scan/face", "{\"mood\":\"happy\",\"confidence\":90}",
                "/api/scan/voice", "{\"transcript\":\"I feel okay\",\"audioFeatures\":{}}"
        );

        Map<String, String> tokenScenarios = new LinkedHashMap<>();
        tokenScenarios.put("NO_TOKEN", null);
        tokenScenarios.put("EXPIRED_TOKEN", "Bearer " + expiredToken);
        tokenScenarios.put("TAMPERED_TOKEN", "Bearer " + tamperedToken);
        tokenScenarios.put("WRONG_SIGNATURE_TOKEN", "Bearer " + wrongSignatureToken);

        List<String> logLines = new ArrayList<>();
        logLines.add(String.format("AUTHENTICATION MATRIX SECURITY REPORT - %s", new Date()));
        logLines.add("==========================================================================================");
        logLines.add(String.format("%-18s | %-24s | %-12s | %-8s | %s", "ENDPOINT", "SCENARIO", "HTTP STATUS", "VERDICT", "NOTES"));
        logLines.add("------------------------------------------------------------------------------------------");

        int totalEvaluated = 0;
        int correctlyRejected = 0;
        List<String> securityAnomalies = new ArrayList<>();

        for (Map.Entry<String, String> endpointEntry : protectedEndpoints.entrySet()) {
            String endpoint = endpointEntry.getKey();
            String payload = endpointEntry.getValue();

            for (Map.Entry<String, String> scenarioEntry : tokenScenarios.entrySet()) {
                totalEvaluated++;
                String scenario = scenarioEntry.getKey();
                String authHeader = scenarioEntry.getValue();

                var reqBuilder = post(endpoint)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload);

                if (authHeader != null) {
                    reqBuilder.header("Authorization", authHeader);
                }

                MvcResult result = mockMvc.perform(reqBuilder).andReturn();
                int status = result.getResponse().getStatus();

                boolean isSecure = (status == 401 || status == 403);
                String verdict = isSecure ? "PASS (401/403)" : "FAIL (" + status + ")";
                String notes = isSecure ? "Access properly denied" : "SECURITY LEAK: Protected endpoint returned " + status;

                if (isSecure) {
                    correctlyRejected++;
                } else {
                    securityAnomalies.add(String.format("%s under %s returned HTTP %d", endpoint, scenario, status));
                }

                logLines.add(String.format("%-18s | %-24s | %-12d | %-8s | %s",
                        endpoint, scenario, status, verdict, notes));
            }
        }

        logLines.add("==========================================================================================");
        logLines.add(String.format("TOTAL MATRIX SCENARIOS TESTED: %d", totalEvaluated));
        logLines.add(String.format("CORRECTLY REJECTED (401/403): %d / %d (%.2f%%)",
                correctlyRejected, totalEvaluated, (double) correctlyRejected / totalEvaluated * 100.0));
        logLines.add(String.format("SECURITY ANOMALIES (NON-401/403): %d", securityAnomalies.size()));
        for (String anomaly : securityAnomalies) {
            logLines.add("  - ALERT: " + anomaly);
        }
        logLines.add("==========================================================================================");

        Path rawDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawDir)) {
            rawDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawDir);
        Files.write(rawDir.resolve("auth_matrix_raw.txt"), logLines);

        assertTrue(securityAnomalies.isEmpty(), "Zero security anomalies expected across protected endpoints");
        System.out.println("Auth Matrix Benchmark Completed: 100% rejected with 401/403. Raw log written.");
    }
}
