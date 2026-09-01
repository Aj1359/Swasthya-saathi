package com.swasthyasaathi.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "profiles", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String name;
    
    private String gender;
    
    private Integer age;
    
    private String occupation;
    
    private String country;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profile_stressors", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "stressor")
    @Builder.Default
    private List<String> collegeStressors = new ArrayList<>();

    @Column(name = "happiness_index")
    @Builder.Default
    private Integer happinessIndex = 70;

    @Column(name = "health_index")
    @Builder.Default
    private Integer healthIndex = 70;

    @Column(name = "chat_memory_enabled", nullable = false)
    @Builder.Default
    private Boolean chatMemoryEnabled = true;

    @Column(name = "voice_analysis_enabled", nullable = false)
    @Builder.Default
    private Boolean voiceAnalysisEnabled = true;

    @Column(name = "streak_days", nullable = false)
    @Builder.Default
    private Integer streakDays = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
