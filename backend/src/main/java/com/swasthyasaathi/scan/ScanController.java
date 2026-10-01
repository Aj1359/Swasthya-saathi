package com.swasthyasaathi.scan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.FaceScan;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.model.VoiceMoodScan;
import com.swasthyasaathi.repository.FaceScanRepository;
import com.swasthyasaathi.repository.ProfileRepository;
import com.swasthyasaathi.repository.VoiceMoodScanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/scan")
public class ScanController {

    private static final Logger log = LoggerFactory.getLogger(ScanController.class);

    private final GeminiClient geminiClient;
    private final FaceScanRepository faceScanRepository;
    private final VoiceMoodScanRepository voiceMoodScanRepository;
    private final ProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    public ScanController(GeminiClient geminiClient,
                          FaceScanRepository faceScanRepository,
                          VoiceMoodScanRepository voiceMoodScanRepository,
                          ProfileRepository profileRepository,
                          ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.faceScanRepository = faceScanRepository;
        this.voiceMoodScanRepository = voiceMoodScanRepository;
        this.profileRepository = profileRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/face")
    public ResponseEntity<?> faceScan(@RequestBody Map<String, Object> request,
                                      @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Profile profile = userPrincipal != null ? userPrincipal.getProfile() : null;

        // Extract potential preprocessed metrics from client-side vision pipeline
        String clientMood = (String) request.get("mood");
        
        Integer clientConf = null;
        if (request.get("confidence") instanceof Number n) {
            clientConf = n.intValue();
        }

        Integer clientPostureScore = null;
        if (request.get("posture_score") instanceof Number n) {
            clientPostureScore = n.intValue();
        } else if (request.get("postureScore") instanceof Number n) {
            clientPostureScore = n.intValue();
        }

        String clientDesc = (String) request.get("description");
        String clientTip = (String) request.get("wellness_tip") != null ? (String) request.get("wellness_tip") : (String) request.get("wellnessTip");
        
        @SuppressWarnings("unchecked")
        List<String> healthFlags = request.get("health_flags") instanceof List ? (List<String>) request.get("health_flags")
                : (request.get("healthFlags") instanceof List ? (List<String>) request.get("healthFlags") : new ArrayList<>());

        @SuppressWarnings("unchecked")
        List<String> postureFlags = request.get("posture_flags") instanceof List ? (List<String>) request.get("posture_flags")
                : (request.get("postureFlags") instanceof List ? (List<String>) request.get("postureFlags") : new ArrayList<>());

        try {
            String mood;
            int confidence;
            String description;
            String wellnessTip;
            Integer postureScore;

            // 1. CANONICAL PATH: Client-side preprocessed vision result
            if (clientMood != null && !clientMood.isBlank()) {
                mood = clientMood.toLowerCase();
                confidence = clientConf != null ? clientConf : 85;
                description = (clientDesc != null && !clientDesc.isBlank())
                        ? clientDesc
                        : "This session detected visual patterns associated with " + mood + ". This isn't a medical assessment.";
                wellnessTip = (clientTip != null && !clientTip.isBlank())
                        ? clientTip
                        : "Take a short break, hydrate, and relax your neck and shoulders.";
                postureScore = clientPostureScore;
            } 
            // 2. FALLBACK PATH: Gemini non-diagnostic structured evaluation (Without fake image placeholder)
            else {
                Boolean postureMode = (Boolean) request.getOrDefault("postureMode", false);
                String systemPrompt = "You are a supportive mental wellness companion for youth and individuals. You MUST NOT make medical or clinical diagnostic statements. Return ONLY valid JSON format. Never claim the user has a medical disease or dehydration.";
                String userPrompt = String.format(
                    "Evaluate facial expression parameters. Posture mode is %s.\n" +
                    "Determine non-clinical mood class (happy, sad, angry, anxious, neutral, tired, stressed, content).\n" +
                    "Return JSON strictly in this format:\n" +
                    "{\n" +
                    "  \"mood\": \"neutral\",\n" +
                    "  \"confidence\": 85,\n" +
                    "  \"description\": \"This session detected visual patterns that may be associated with tiredness or tension. This isn't a medical assessment.\",\n" +
                    "  \"wellness_tip\": \"Take a short 2-minute break, rest your eyes, and stay hydrated.\",\n" +
                    "  \"health_flags\": [\"screen_fatigue\"],\n" +
                    "  \"posture_score\": 85,\n" +
                    "  \"posture_flags\": [\"good_alignment\"],\n" +
                    "  \"posture_tip\": \"Keep your shoulders relaxed and spine upright.\"\n" +
                    "}",
                    postureMode
                );

                String jsonOutput = geminiClient.generateContent(systemPrompt, userPrompt, true);
                JsonNode root = objectMapper.readTree(jsonOutput);

                mood = root.path("mood").asText("neutral").toLowerCase();
                confidence = root.path("confidence").asInt(80);
                description = root.path("description").asText("This session detected visual expression patterns. This isn't a medical assessment.");
                wellnessTip = root.path("wellness_tip").asText("Stay hydrated and practice box breathing.");
                
                root.path("health_flags").forEach(n -> healthFlags.add(n.asText()));
                postureScore = root.has("posture_score") && !root.path("posture_score").isNull() ? root.path("posture_score").asInt() : null;
                root.path("posture_flags").forEach(n -> postureFlags.add(n.asText()));
            }

            // Ensure non-diagnostic disclaimer in description
            if (!description.contains("medical assessment")) {
                description += " (Note: This isn't a medical assessment.)";
            }

            // Update user profile wellness indices
            if (profile != null) {
                int happinessChange = (mood.equals("happy") || mood.equals("content")) ? 5 : ((mood.equals("sad") || mood.equals("stressed")) ? -5 : 0);
                int healthChange = (postureScore != null && postureScore < 50) ? -5 : ((postureScore != null && postureScore >= 80) ? 5 : 0);

                profile.setHappinessIndex(Math.max(10, Math.min(100, profile.getHappinessIndex() + happinessChange)));
                profile.setHealthIndex(Math.max(10, Math.min(100, profile.getHealthIndex() + healthChange)));
                profileRepository.save(profile);
            }

            // Save FaceScan record
            FaceScan faceScan = FaceScan.builder()
                    .profile(profile)
                    .mood(mood)
                    .confidence(confidence)
                    .description(description)
                    .wellnessTip(wellnessTip)
                    .healthFlags(healthFlags)
                    .postureScore(postureScore)
                    .postureFlags(postureFlags)
                    .build();

            FaceScan savedScan = faceScanRepository.save(faceScan);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedScan);

        } catch (Exception e) {
            log.error("Face scan processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Scan analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/voice")
    public ResponseEntity<?> voiceScan(@RequestBody Map<String, Object> request,
                                       @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String transcript = (String) request.get("transcript");
        @SuppressWarnings("unchecked")
        Map<String, Object> audioFeatures = (Map<String, Object>) request.get("audioFeatures");

        Profile profile = userPrincipal != null ? userPrincipal.getProfile() : null;

        try {
            String systemPrompt = "You are a supportive mental wellness assistant. Analyze acoustic features and speech transcripts. Use non-diagnostic, supportive phrasing. Return ONLY valid JSON.";
            String userPrompt = String.format(
                "Analyze vocal parameters and transcript.\n" +
                "Transcript: \"%s\"\n" +
                "Audio Features: %s\n" +
                "Evaluate non-clinical mood class, confidence, state indicators, suggested wellness action, and urgency level (low, moderate, high, crisis).\n" +
                "Return JSON ONLY in this format:\n" +
                "{\n" +
                "  \"mood\": \"stressed\",\n" +
                "  \"confidence\": 80,\n" +
                "  \"mental_state_indicators\": [\"academic_tension\", \"low_energy\"],\n" +
                "  \"suggested_action\": \"Try 4-7-8 breathing to lower stress.\",\n" +
                "  \"urgency\": \"moderate\",\n" +
                "  \"phq2_flag\": false\n" +
                "}",
                transcript != null ? transcript : "No speech transcript available.",
                audioFeatures != null ? audioFeatures.toString() : "None"
            );

            String jsonOutput = geminiClient.generateContent(systemPrompt, userPrompt, true);
            JsonNode root = objectMapper.readTree(jsonOutput);

            String mood = root.path("mood").asText("neutral");
            int confidence = root.path("confidence").asInt(75);
            String urgency = root.path("urgency").asText("low");
            String suggestedAction = root.path("suggested_action").asText("Open the breathing tab and center yourself.");
            
            List<String> indicators = new ArrayList<>();
            root.path("mental_state_indicators").forEach(n -> indicators.add(n.asText()));

            // Save VoiceMoodScan record
            VoiceMoodScan voiceScan = VoiceMoodScan.builder()
                    .profile(profile)
                    .mood(mood)
                    .confidence(confidence)
                    .transcript(transcript)
                    .audioFeatures(audioFeatures != null ? objectMapper.writeValueAsString(audioFeatures) : null)
                    .mentalStateIndicators(indicators)
                    .suggestedAction(suggestedAction)
                    .urgency(urgency)
                    .build();

            VoiceMoodScan savedScan = voiceMoodScanRepository.save(voiceScan);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedScan);

        } catch (Exception e) {
            log.error("Voice scan processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Voice analysis failed: " + e.getMessage()));
        }
    }
}
