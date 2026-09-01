package com.swasthyasaathi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "face_scans", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceScan {

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
    private String description;

    @Column(name = "wellness_tip", columnDefinition = "TEXT")
    private String wellnessTip;

    @ElementCollection
    @CollectionTable(name = "face_scan_health_flags", joinColumns = @JoinColumn(name = "face_scan_id"))
    @Column(name = "health_flag")
    @Builder.Default
    private List<String> healthFlags = new ArrayList<>();

    @Column(name = "posture_score")
    private Integer postureScore;

    @ElementCollection
    @CollectionTable(name = "face_scan_posture_flags", joinColumns = @JoinColumn(name = "face_scan_id"))
    @Column(name = "posture_flag")
    @Builder.Default
    private List<String> postureFlags = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
