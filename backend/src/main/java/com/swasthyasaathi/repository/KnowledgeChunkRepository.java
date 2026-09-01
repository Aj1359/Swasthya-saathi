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

    // Native query utilizing pgvector's cosine distance operator <=>
    // We bind the float[] embedding as a string representation like '[0.1, 0.2, ...]'
    @Query(value = "SELECT id, source, content, created_at, null as embedding " +
                   "FROM public.knowledge_chunks " +
                   "ORDER BY embedding <=> cast(:embeddingStr as vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<KnowledgeChunk> findSimilarChunks(@Param("embeddingStr") String embeddingStr, @Param("limit") int limit);
}
