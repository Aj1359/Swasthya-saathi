package com.swasthyasaathi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "knowledge_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String source;

    private String title;

    private String category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 768-dimensional embedding vector matching Gemini embedding model output
    @Column(name = "embedding")
    private float[] embedding;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}

