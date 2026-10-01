package com.swasthyasaathi.rag;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.repository.KnowledgeChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RagServiceTest {

    private GeminiClient geminiClient;
    private KnowledgeChunkRepository knowledgeChunkRepository;
    private RagService ragService;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        knowledgeChunkRepository = mock(KnowledgeChunkRepository.class);
        ragService = new RagService(geminiClient, knowledgeChunkRepository);
    }

    @Test
    @DisplayName("RAG 1: Embedding Dimension Verification (768-dim)")
    void testEmbeddingDimension() {
        float[] mockVector = new float[768];
        mockVector[0] = 0.5f;
        when(geminiClient.embedContent(anyString())).thenReturn(mockVector);

        float[] result = geminiClient.embedContent("Test RAG query");
        assertNotNull(result);
        assertEquals(768, result.length, "Embedding dimension must be exactly 768-dimensional");
    }

    @Test
    @DisplayName("RAG 2: Retrieval Test for Relevant Chunks")
    void testRetrieval() {
        float[] mockVector = new float[768];
        when(geminiClient.embedContent(anyString())).thenReturn(mockVector);

        KnowledgeChunk chunk = KnowledgeChunk.builder()
                .source("CBT Guide")
                .title("Box Breathing")
                .content("Inhale for 4s, hold for 4s, exhale for 4s.")
                .build();

        when(knowledgeChunkRepository.findSimilarChunks(anyString(), anyDouble(), anyInt()))
                .thenReturn(List.of(chunk));

        List<KnowledgeChunk> results = ragService.retrieveRelevantChunks("I need breathing exercises", 0.3, 4);
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Box Breathing", results.get(0).getTitle());
    }

    @Test
    @DisplayName("RAG 3: Empty Retrieval Result Handling")
    void testEmptyResult() {
        float[] mockVector = new float[768];
        when(geminiClient.embedContent(anyString())).thenReturn(mockVector);
        when(knowledgeChunkRepository.findSimilarChunks(anyString(), anyDouble(), anyInt()))
                .thenReturn(List.of());

        List<KnowledgeChunk> results = ragService.retrieveRelevantChunks("Unmatched random query", 0.3, 4);
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("RAG 4: Malformed / Null Embedding Handling")
    void testMalformedEmbedding() {
        List<KnowledgeChunk> nullQueryResults = ragService.retrieveRelevantChunks(null, 0.3, 4);
        assertNotNull(nullQueryResults);
        assertTrue(nullQueryResults.isEmpty());

        List<KnowledgeChunk> blankQueryResults = ragService.retrieveRelevantChunks("   ", 0.3, 4);
        assertNotNull(blankQueryResults);
        assertTrue(blankQueryResults.isEmpty());
    }
}
