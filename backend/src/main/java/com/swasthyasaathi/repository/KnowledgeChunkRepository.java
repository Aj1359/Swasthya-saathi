package com.swasthyasaathi.repository;

import com.swasthyasaathi.model.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, UUID> {

    // Native query utilizing pgvector's cosine distance operator <=> with similarity threshold and null checks
    @Query(value = "SELECT id, source, title, category, content, created_at, null as embedding " +
                   "FROM public.knowledge_chunks " +
                   "WHERE embedding IS NOT NULL " +
                   "AND (1 - (embedding <=> cast(:embeddingStr as vector))) > :threshold " +
                   "ORDER BY embedding <=> cast(:embeddingStr as vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<KnowledgeChunk> findSimilarChunks(@Param("embeddingStr") String embeddingStr,
                                           @Param("threshold") double threshold,
                                           @Param("limit") int limit);

    // Fallback search without similarity threshold
    @Query(value = "SELECT id, source, title, category, content, created_at, null as embedding " +
                   "FROM public.knowledge_chunks " +
                   "WHERE embedding IS NOT NULL " +
                   "ORDER BY embedding <=> cast(:embeddingStr as vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<KnowledgeChunk> findTopSimilarChunks(@Param("embeddingStr") String embeddingStr,
                                              @Param("limit") int limit);
}

