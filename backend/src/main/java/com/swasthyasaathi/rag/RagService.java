package com.swasthyasaathi.rag;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.repository.KnowledgeChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final GeminiClient geminiClient;
    private final KnowledgeChunkRepository knowledgeChunkRepository;

    public RagService(GeminiClient geminiClient, KnowledgeChunkRepository knowledgeChunkRepository) {
        this.geminiClient = geminiClient;
        this.knowledgeChunkRepository = knowledgeChunkRepository;
    }

    /**
     * Retrieve matching document chunks related to the user query using pgvector similarity search.
     */
    public List<KnowledgeChunk> retrieveRelevantChunks(String queryText, double threshold, int limit) {
        if (queryText == null || queryText.isBlank()) {
            return Collections.emptyList();
        }

        try {
            // Step 1: Embed the user's text query using Gemini (768-dim)
            float[] queryEmbedding = geminiClient.embedContent(queryText);

            if (queryEmbedding == null || queryEmbedding.length == 0) {
                log.warn("Gemini returned empty or null embedding vector for query");
                return Collections.emptyList();
            }

            // Step 2: Convert the float[] embedding array to Postgres vector format: "[0.123,0.456,...]"
            String embeddingStr = Arrays.toString(queryEmbedding).replace(" ", "");

            // Step 3: Run the native cosine distance query with threshold filtering
            List<KnowledgeChunk> chunks = knowledgeChunkRepository.findSimilarChunks(embeddingStr, threshold, limit);
            if (chunks.isEmpty()) {
                log.info("No knowledge chunks passed similarity threshold of {}; falling back to top chunks", threshold);
                chunks = knowledgeChunkRepository.findTopSimilarChunks(embeddingStr, Math.min(limit, 2));
            }

            return chunks;
        } catch (Exception e) {
            log.error("Failed RAG vector retrieval, proceeding with clean fallback", e);
            return Collections.emptyList();
        }
    }

    public List<KnowledgeChunk> retrieveRelevantChunks(String queryText, int limit) {
        return retrieveRelevantChunks(queryText, 0.3, limit);
    }

    /**
     * Synthesize retrieved chunks into a single concatenated context string to inject into system prompts.
     */
    public String buildContextPayload(String queryText, int limit) {
        List<KnowledgeChunk> chunks = retrieveRelevantChunks(queryText, limit);
        if (chunks == null || chunks.isEmpty()) {
            return "No background reference guides retrieved.";
        }

        return chunks.stream()
                .map(chunk -> String.format("[%s] %s: %s", 
                        chunk.getCategory() != null ? chunk.getCategory() : chunk.getSource(), 
                        chunk.getTitle() != null ? chunk.getTitle() : chunk.getSource(), 
                        chunk.getContent()))
                .collect(Collectors.joining("\n\n---\n\n"));
    }
}

