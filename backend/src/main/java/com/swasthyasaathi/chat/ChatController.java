package com.swasthyasaathi.chat;

import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.*;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final GeminiClient geminiClient;
    private final RagService ragService;
    private final ChatMessageRepository chatMessageRepository;
    private final FaceScanRepository faceScanRepository;
    private final VoiceMoodScanRepository voiceMoodScanRepository;
    private final ProfileRepository profileRepository;

    public ChatController(GeminiClient geminiClient,
                          RagService ragService,
                          ChatMessageRepository chatMessageRepository,
                          FaceScanRepository faceScanRepository,
                          VoiceMoodScanRepository voiceMoodScanRepository,
                          ProfileRepository profileRepository) {
        this.geminiClient = geminiClient;
        this.ragService = ragService;
        this.chatMessageRepository = chatMessageRepository;
        this.faceScanRepository = faceScanRepository;
        this.voiceMoodScanRepository = voiceMoodScanRepository;
        this.profileRepository = profileRepository;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request,
                                  @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String content = request.get("content");
        String sessionId = request.getOrDefault("sessionId", "default");

        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
        }

        Profile profile = userPrincipal.getProfile();

        // 1. RAG Retrieval Step: Fetch relevant chunks from vector db
        List<KnowledgeChunk> retrievedChunks = ragService.retrieveRelevantChunks(content, 4);
        String ragContext = retrievedChunks.stream()
                .map(chunk -> String.format("[%s] %s", chunk.getSource(), chunk.getContent()))
                .collect(Collectors.joining("\n\n"));

        // Log the retrieved chunks for auditing and quality evaluation
        log.info("RAG CHUNKS RETRIEVED for user message '{}': {}", content, 
            retrievedChunks.stream().map(KnowledgeChunk::getSource).collect(Collectors.toList()));

        // 2. Fetch Latest Face and Voice Scans for current state context
        List<FaceScan> faceScans = faceScanRepository.findByProfileOrderByCreatedAtDesc(profile);
        List<VoiceMoodScan> voiceScans = voiceMoodScanRepository.findByProfileOrderByCreatedAtDesc(profile);

        String latestFaceScanCtx = faceScans.isEmpty() ? "None" : 
                String.format("Mood: %s, Confidence: %d%%, Health Flags: %s, Posture Score: %s, Posture Flags: %s",
                        faceScans.get(0).getMood(),
                        faceScans.get(0).getConfidence(),
                        faceScans.get(0).getHealthFlags(),
                        faceScans.get(0).getPostureScore() != null ? faceScans.get(0).getPostureScore() : "None",
                        faceScans.get(0).getPostureFlags());

        String latestVoiceScanCtx = voiceScans.isEmpty() ? "None" :
                String.format("Mood: %s, Transcript: \"%s\", Urgency: %s, suggestedAction: %s",
                        voiceScans.get(0).getMood(),
                        voiceScans.get(0).getTranscript() != null ? voiceScans.get(0).getTranscript() : "",
                        voiceScans.get(0).getUrgency(),
                        voiceScans.get(0).getSuggestedAction());

        // 3. Fetch Session History
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        String historyText = history.stream()
                .map(msg -> String.format("%s: %s", msg.getRole(), msg.getContent()))
                .collect(Collectors.joining("\n"));

        // 4. Construct Prompts
        String systemPrompt = String.format(
            "You are Ruhi, an empathetic mental wellness companion. You are the first line of support for users who cannot access therapy due to cost, stigma, or location.\n" +
            "Grounded CBT/DBT resources and guides:\n" +
            "=== START RAG GUIDELINES ===\n" +
            "%s\n" +
            "=== END RAG GUIDELINES ===\n\n" +
            "Be conversational, supportive, and use friendly formatting. Ground your tips in the RAG guidelines. " +
            "If the user is a student, address academic stress or exam season issues warmly. " +
            "Do not state clinical diagnostic scores (like GAD-7) directly to the user. " +
            "Crisis policy: If severe distress/suicidal ideation is detected in the input, proactively offer the user regional crisis helplines, specifically referencing Toll-Free options like KIRAN (1800-599-0019) or iCall (9152987821) in India.",
            ragContext
        );

        String userPrompt = String.format(
            "USER PROFILE:\n" +
            "- Name: %s\n" +
            "- Age: %s\n" +
            "- Occupation: %s\n" +
            "- Location: %s\n\n" +
            "PHYSIOLOGICAL CONTEXT (LATEST SCANS):\n" +
            "- Face/Posture Scan: %s\n" +
            "- Voice/Speech Scan: %s\n\n" +
            "SESSION HISTORY:\n" +
            "%s\n\n" +
            "USER LATEST MESSAGE:\n" +
            "\"%s\"\n\n" +
            "Generate Ruhi's empathetic response.",
            profile.getName() != null ? profile.getName() : "Friend",
            profile.getAge() != null ? profile.getAge() : "Unknown",
            profile.getOccupation() != null ? profile.getOccupation() : "Not Specified",
            profile.getCountry() != null ? profile.getCountry() : "India",
            latestFaceScanCtx,
            latestVoiceScanCtx,
            historyText.isEmpty() ? "[No history yet]" : historyText,
            content
        );

        // 5. Generate and Save
        String reply = geminiClient.generateContent(systemPrompt, userPrompt, false);

        // Save User Message
        ChatMessage userMsg = ChatMessage.builder()
                .profile(profile)
                .sessionId(sessionId)
                .role("user")
                .content(content)
                .build();
        chatMessageRepository.save(userMsg);

        // Save Assistant Message
        ChatMessage assistantMsg = ChatMessage.builder()
                .profile(profile)
                .sessionId(sessionId)
                .role("assistant")
                .content(reply)
                .build();
        chatMessageRepository.save(assistantMsg);

        // Update User Activity date
        profile.setLastActivityDate(java.time.LocalDate.now());
        profileRepository.save(profile);

        return ResponseEntity.ok(Map.of(
            "reply", reply,
            "retrievedSources", retrievedChunks.stream().map(KnowledgeChunk::getSource).collect(Collectors.toList())
        ));
    }
}
