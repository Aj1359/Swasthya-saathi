package com.swasthyasaathi.scan;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.FaceScan;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.repository.FaceScanRepository;
import com.swasthyasaathi.repository.ProfileRepository;
import com.swasthyasaathi.repository.VoiceMoodScanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ScanControllerTest {

    private GeminiClient geminiClient;
    private FaceScanRepository faceScanRepository;
    private VoiceMoodScanRepository voiceMoodScanRepository;
    private ProfileRepository profileRepository;
    private ObjectMapper objectMapper;

    private ScanController scanController;
    private UserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        faceScanRepository = mock(FaceScanRepository.class);
        voiceMoodScanRepository = mock(VoiceMoodScanRepository.class);
        profileRepository = mock(ProfileRepository.class);
        objectMapper = new ObjectMapper();

        scanController = new ScanController(
                geminiClient,
                faceScanRepository,
                voiceMoodScanRepository,
                profileRepository,
                objectMapper
        );

        Profile profile = Profile.builder().id(UUID.randomUUID()).name("Scan User").build();
        userPrincipal = new UserPrincipal(profile);
    }

    @Test
    @DisplayName("Face 1: Valid Preprocessed Face Scan Processing")
    void testValidFaceScan() {
        Map<String, Object> request = Map.of(
                "mood", "happy",
                "confidence", 90,
                "posture_score", 85,
                "description", "This session detected visual expression markers. This isn't a medical assessment.",
                "wellness_tip", "Keep up your energy and stay hydrated.",
                "health_flags", List.of("bright_expression"),
                "posture_flags", List.of("good_alignment")
        );

        when(faceScanRepository.save(any(FaceScan.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<?> response = scanController.faceScan(request, userPrincipal);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody() instanceof FaceScan);

        FaceScan saved = (FaceScan) response.getBody();
        assertEquals("happy", saved.getMood());
        assertEquals(90, saved.getConfidence());
    }

    @Test
    @DisplayName("Face 2: Fallback Gemini Scan Generation")
    void testFallbackFaceScan() {
        Map<String, Object> request = Map.of("postureMode", true);

        String mockGeminiJson = "{" +
                "\"mood\": \"tired\"," +
                "\"confidence\": 85," +
                "\"description\": \"Detected screen fatigue markers. This isn't a medical assessment.\"," +
                "\"wellness_tip\": \"Rest your eyes.\"," +
                "\"health_flags\": [\"heavy_eyelids\"]," +
                "\"posture_score\": 75," +
                "\"posture_flags\": [\"forward_head\"]" +
                "}";

        when(geminiClient.generateContent(anyString(), anyString(), eq(true))).thenReturn(mockGeminiJson);
        when(faceScanRepository.save(any(FaceScan.class))).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<?> response = scanController.faceScan(request, userPrincipal);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        FaceScan saved = (FaceScan) response.getBody();
        assertNotNull(saved);
        assertEquals("tired", saved.getMood());
    }
}
