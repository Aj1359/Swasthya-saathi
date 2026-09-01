package com.swasthyasaathi.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.models.embedding}")
    private String embeddingModel;

    @Value("${gemini.models.generation}")
    private String generationModel;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiClient(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    /**
     * Call Gemini Embedding model to get float vector of text
     */
    public float[] embedContent(String text) {
        try {
            String url = String.format("%s/%s:embedContent?key=%s", apiUrl, embeddingModel, apiKey);

            Map<String, Object> requestBody = Map.of(
                "model", "models/" + embeddingModel,
                "content", Map.of(
                    "parts", List.of(Map.of("text", text))
                ),
                "outputDimensionality", 768
            );

            String responseStr = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode valuesNode = root.path("embedding").path("values");
            if (valuesNode.isArray()) {
                float[] values = new float[valuesNode.size()];
                for (int i = 0; i < valuesNode.size(); i++) {
                    values[i] = (float) valuesNode.get(i).asDouble();
                }
                return values;
            }
            throw new RuntimeException("Embedding values not found in response");
        } catch (Exception e) {
            log.error("Failed to generate embedding from Gemini", e);
            throw new RuntimeException("Embedding failed: " + e.getMessage(), e);
        }
    }

    /**
     * Call Gemini Content Generation model with option for structured JSON output
     */
    public String generateContent(String systemPrompt, String userPrompt, boolean jsonMode) {
        try {
            String url = String.format("%s/%s:generateContent?key=%s", apiUrl, generationModel, apiKey);

            Map<String, Object> contents = Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userPrompt))
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(contents));

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                requestBody.put("systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemPrompt))
                ));
            }

            if (jsonMode) {
                requestBody.put("generationConfig", Map.of(
                    "responseMimeType", "application/json"
                ));
            }

            String responseStr = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode textNode = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text");

            if (!textNode.isMissingNode()) {
                return textNode.asText();
            }
            throw new RuntimeException("Text response content not found in Gemini payload");
        } catch (Exception e) {
            log.error("Failed to generate text from Gemini", e);
            throw new RuntimeException("Generation failed: " + e.getMessage(), e);
        }
    }
}
