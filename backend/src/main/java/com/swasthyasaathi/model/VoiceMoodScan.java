package com.swasthyasaathi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "voice_mood_scans", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceMoodScan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Profile profile;

    @Column(nullable = false)
    private String mood;

    @Column(nullable = false)
    @Builder.Default
    private Integer confidence = 0;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    // Map audio_features to a String representing JSONB (parsed locally with ObjectMapper in Java)
    @Column(name = "audio_features", columnDefinition = "jsonb")
    private String audioFeatures;

    @ElementCollection
    @CollectionTable(name = "voice_scan_indicators", joinColumns = @JoinColumn(name = "voice_scan_id"))
    @Column(name = "indicator")
    @Builder.Default
    private List<String> mentalStateIndicators = new ArrayList<>();

    @Column(name = "suggested_action", columnDefinition = "TEXT")
    private String suggestedAction;

    @Column(nullable = false)
    @Builder.Default
    private String urgency = "low";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
