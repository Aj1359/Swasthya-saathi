package com.swasthyasaathi.rag;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.KnowledgeChunk;
import com.swasthyasaathi.repository.KnowledgeChunkRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RagService {

    private final GeminiClient geminiClient;
    private final KnowledgeChunkRepository knowledgeChunkRepository;

    public RagService(GeminiClient geminiClient, KnowledgeChunkRepository knowledgeChunkRepository) {
        this.geminiClient = geminiClient;
        this.knowledgeChunkRepository = knowledgeChunkRepository;
    }

    /**
     * Retrieve matching document chunks related to the user query using pgvector similarity search.
     */
    public List<KnowledgeChunk> retrieveRelevantChunks(String queryText, int limit) {
        // Step 1: Embed the user's text query using Gemini
        float[] queryEmbedding = geminiClient.embedContent(queryText);

        // Step 2: Convert the float[] embedding array to a Postgres vector-compatible string format: "[0.123,0.456,...]"
        String embeddingStr = Arrays.toString(queryEmbedding)
                                    .replace(" ", ""); // remove whitespace

        // Step 3: Run the native cosine distance query
        return knowledgeChunkRepository.findSimilarChunks(embeddingStr, limit);
    }

    /**
     * Synthesize retrieved chunks into a single concatenated context string to inject into system prompts.
     */
    public String buildContextPayload(String queryText, int limit) {
        List<KnowledgeChunk> chunks = retrieveRelevantChunks(queryText, limit);
        if (chunks.isEmpty()) {
            return "No background reference guides retrieved.";
        }

        return chunks.stream()
                .map(chunk -> String.format("Source: %s\nContent: %s", chunk.getSource(), chunk.getContent()))
                .collect(Collectors.joining("\n\n---\n\n"));
    }
}
