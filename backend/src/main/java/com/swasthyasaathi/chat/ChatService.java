package com.swasthyasaathi.chat;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.*;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    public enum ChatIntent {
        GENERAL,
        EMOTIONAL_SUPPORT,
        WELLNESS,
        COPING_EXERCISE,
        CRISIS,
        UNKNOWN
    }

    private static final Pattern CRISIS_PATTERN = Pattern.compile(
        "\\b(suicide|suicidal|kill myself|end my life|want to die|self-harm|harm myself|hopeless|cannot go on|don't want to live|end it all)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EMOTIONAL_SUPPORT_PATTERN = Pattern.compile(
        "\\b(sad|depressed|lonely|overwhelmed|grief|crying|anxious|heartbroken|scared|hurt|pain|fearful)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern WELLNESS_PATTERN = Pattern.compile(
        "\\b(sleep|diet|water|hydration|exercise|workout|posture|health|habit|routine|nutrition)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern COPING_EXERCISE_PATTERN = Pattern.compile(
        "\\b(breathing|meditation|mindfulness|panic|grounding|coping|relax|reset|cbt|dbt|stretch)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern GENERAL_PATTERN = Pattern.compile(
        "\\b(hi|hello|hey|how are you|who are you|help|what can you do|good morning|good evening)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private final GeminiClient geminiClient;
    private final RagService ragService;
    private final ChatMessageRepository chatMessageRepository;
    private final FaceScanRepository faceScanRepository;
    private final VoiceMoodScanRepository voiceMoodScanRepository;
    private final ProfileRepository profileRepository;

    public ChatService(GeminiClient geminiClient,
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

    /**
     * Canonical AI Safety & Chat Orchestration Layer:
     * 1. Input Validation
     * 2. Intent Detection (GENERAL, EMOTIONAL_SUPPORT, WELLNESS, COPING_EXERCISE, CRISIS, UNKNOWN)
     * 3. CRISIS Dedicated Response Path (Bypasses LLM generation for safety)
     * 4. RAG Retrieval & Bounded Context Assembly
     * 5. Gemini Synthesis & Output Sanitization (Non-diagnostic safety enforcement)
     */
    public ChatResponse processChatRequest(String content, String sessionId, Profile profile) {
        long startTime = System.currentTimeMillis();

        // ─── 1. INPUT VALIDATION ───────────────────────────────────────────────────
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty.");
        }
        String sanitizedContent = content.trim();
        String safeSessionId = (sessionId != null && !sessionId.isBlank()) ? sessionId : "default";

        String userHash = profile != null ? Integer.toHexString(profile.getId().hashCode()) : "anon";
        String sessionHash = Integer.toHexString(safeSessionId.hashCode());

        // ─── 2. SAFETY & INTENT DETECTION ─────────────────────────────────────────
        ChatIntent detectedIntent = detectIntent(sanitizedContent);

        // ─── 3. CRISIS ISOLATED RESPONSE PATH (NO STANDARD RAG CHAT) ───────────────
        if (detectedIntent == ChatIntent.CRISIS) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("chat_request_crisis user_hash={} session_hash={} intent=CRISIS latency_ms={} status=TRIGGERED",
                    userHash, sessionHash, latency);
            
            String crisisReply = "I hear how much pain you're in right now, and I want you to know you don't have to carry this alone. " +
                "Please reach out immediately to compassionate professionals who are ready to support you 24/7:\n\n" +
                "• **Tele-MANAS (India)**: Call **14416** or **1800-891-4416** (Toll-Free, 24/7)\n" +
                "• **KIRAN Helpline**: Call **1800-599-0019** (Toll-Free, 24/7)\n" +
                "• **Emergency Services**: Call **112**\n\n" +
                "I am here to stay with you, but please connect with one of these services right away.";

            saveMessagePair(profile, safeSessionId, sanitizedContent, crisisReply);
            return new ChatResponse(crisisReply, List.of("Tele-MANAS Crisis Helpline (14416)", "KIRAN Helpline (1800-599-0019)"), safeSessionId, true, ChatIntent.CRISIS);
        }

        // ─── 4. RAG RETRIEVAL & CONTEXT ASSEMBLY LAYER ─────────────────────────────
        List<KnowledgeChunk> retrievedChunks = ragService.retrieveRelevantChunks(sanitizedContent, 0.3, 4);
        String ragContext = (retrievedChunks == null || retrievedChunks.isEmpty())
                ? "No background reference guides retrieved."
                : retrievedChunks.stream()
                        .map(chunk -> String.format("[%s] %s: %s",
                                chunk.getCategory() != null ? chunk.getCategory() : chunk.getSource(),
                                chunk.getTitle() != null ? chunk.getTitle() : chunk.getSource(),
                                chunk.getContent()))
                        .collect(Collectors.joining("\n\n"));

        // Context from recent physiological scans
        String faceScanCtx = "None";
        String voiceScanCtx = "None";

        if (profile != null) {
            List<FaceScan> faceScans = faceScanRepository.findByProfileOrderByCreatedAtDesc(profile);
            if (!faceScans.isEmpty()) {
                FaceScan latestFace = faceScans.get(0);
                faceScanCtx = String.format("Mood: %s, Confidence: %d%%, Observations: %s, Posture Score: %s",
                        latestFace.getMood(),
                        latestFace.getConfidence(),
                        latestFace.getHealthFlags(),
                        latestFace.getPostureScore() != null ? latestFace.getPostureScore() : "N/A");
            }

            List<VoiceMoodScan> voiceScans = voiceMoodScanRepository.findByProfileOrderByCreatedAtDesc(profile);
            if (!voiceScans.isEmpty()) {
                VoiceMoodScan latestVoice = voiceScans.get(0);
                voiceScanCtx = String.format("Mood: %s, Suggested Action: %s",
                        latestVoice.getMood(),
                        latestVoice.getSuggestedAction());
            }
        }

        // Bounded Conversation History Window (Last 20 messages max)
        List<ChatMessage> recentHistoryDesc = chatMessageRepository.findTop20BySessionIdOrderByCreatedAtDesc(safeSessionId);
        List<ChatMessage> recentHistoryAsc = new ArrayList<>(recentHistoryDesc);
        Collections.reverse(recentHistoryAsc);

        String historyText = recentHistoryAsc.isEmpty()
                ? "[No prior history in this session]"
                : recentHistoryAsc.stream()
                        .map(msg -> String.format("%s: %s", msg.getRole(), msg.getContent()))
                        .collect(Collectors.joining("\n"));

        // System Instructions tailored by Intent
        String systemPrompt = String.format(
            "You are Ruhi, an empathetic mental wellness companion. You provide supportive, non-diagnostic guidance.\n" +
            "DETECTED USER INTENT: %s\n\n" +
            "GROUNDED WELLNESS GUIDELINES:\n" +
            "=== START RAG GUIDELINES ===\n" +
            "%s\n" +
            "=== END RAG GUIDELINES ===\n\n" +
            "STRICT SAFETY & COMMUNICATION RULES:\n" +
            "1. NEVER give clinical diagnoses or medical assessments (e.g. do not say 'You have depression' or 'Your face indicates dehydration').\n" +
            "2. Use non-diagnostic phrasing (e.g. 'You may be feeling tired or strained. Remember this isn't a medical assessment.').\n" +
            "3. Ground your responses in the RAG guidelines when explaining wellness concepts or coping techniques.",
            detectedIntent,
            ragContext
        );

        String userPrompt = String.format(
            "USER PROFILE:\n" +
            "- Name: %s\n" +
            "- Age: %s\n" +
            "- Location: %s\n\n" +
            "PHYSIOLOGICAL OBSERVATIONS (LATEST SCANS):\n" +
            "- Face/Posture: %s\n" +
            "- Voice: %s\n\n" +
            "RECENT SESSION HISTORY:\n" +
            "%s\n\n" +
            "USER MESSAGE:\n" +
            "\"%s\"\n\n" +
            "Generate Ruhi's empathetic response.",
            (profile != null && profile.getName() != null) ? profile.getName() : "Friend",
            (profile != null && profile.getAge() != null) ? profile.getAge() : "Unknown",
            (profile != null && profile.getCountry() != null) ? profile.getCountry() : "India",
            faceScanCtx,
            voiceScanCtx,
            historyText,
            sanitizedContent
        );

        // ─── 5. GEMINI SYNTHESIS LAYER & OUTPUT VALIDATION ─────────────────────────
        String rawReply = geminiClient.generateContent(systemPrompt, userPrompt, false);
        String safeReply = sanitizeOutput(rawReply);

        saveMessagePair(profile, safeSessionId, sanitizedContent, safeReply);

        long latency = System.currentTimeMillis() - startTime;
        log.info("chat_request user_hash={} session_hash={} intent={} latency_ms={} status=SUCCESS",
                userHash, sessionHash, detectedIntent, latency);

        List<String> sources = (retrievedChunks != null)
                ? retrievedChunks.stream().map(c -> c.getTitle() != null ? c.getTitle() : c.getSource()).collect(Collectors.toList())
                : List.of();

        return new ChatResponse(safeReply, sources, safeSessionId, false, detectedIntent);
    }

    private ChatIntent detectIntent(String content) {
        if (CRISIS_PATTERN.matcher(content).find()) {
            return ChatIntent.CRISIS;
        }
        if (COPING_EXERCISE_PATTERN.matcher(content).find()) {
            return ChatIntent.COPING_EXERCISE;
        }
        if (EMOTIONAL_SUPPORT_PATTERN.matcher(content).find()) {
            return ChatIntent.EMOTIONAL_SUPPORT;
        }
        if (WELLNESS_PATTERN.matcher(content).find()) {
            return ChatIntent.WELLNESS;
        }
        if (GENERAL_PATTERN.matcher(content).find()) {
            return ChatIntent.GENERAL;
        }
        return ChatIntent.UNKNOWN;
    }

    private String sanitizeOutput(String output) {
        if (output == null || output.isBlank()) {
            return "I am here with you. How can I support you right now?";
        }
        // Enforce non-diagnostic product language
        return output
            .replaceAll("(?i)your face indicates stress/dehydration", "this session detected visual patterns that may be associated with tiredness. This isn't a medical assessment.")
            .replaceAll("(?i)you are diagnosed with", "you may be experiencing")
            .replaceAll("(?i)medical diagnosis", "wellness observation");
    }

    private void saveMessagePair(Profile profile, String sessionId, String userContent, String assistantContent) {
        if (profile != null) {
            chatMessageRepository.save(ChatMessage.builder()
                    .profile(profile)
                    .sessionId(sessionId)
                    .role("user")
                    .content(userContent)
                    .build());

            chatMessageRepository.save(ChatMessage.builder()
                    .profile(profile)
                    .sessionId(sessionId)
                    .role("assistant")
                    .content(assistantContent)
                    .build());

            profile.setLastActivityDate(LocalDate.now());
            profileRepository.save(profile);
        }
    }

    public record ChatResponse(String reply, List<String> retrievedSources, String sessionId, boolean crisisFlag, ChatIntent intent) {}
}
