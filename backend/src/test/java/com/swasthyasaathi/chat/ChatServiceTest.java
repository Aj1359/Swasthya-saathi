package com.swasthyasaathi.chat;

import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.ChatMessage;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatServiceTest {

    private GeminiClient geminiClient;
    private RagService ragService;
    private ChatMessageRepository chatMessageRepository;
    private FaceScanRepository faceScanRepository;
    private VoiceMoodScanRepository voiceMoodScanRepository;
    private ProfileRepository profileRepository;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        ragService = mock(RagService.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        faceScanRepository = mock(FaceScanRepository.class);
        voiceMoodScanRepository = mock(VoiceMoodScanRepository.class);
        profileRepository = mock(ProfileRepository.class);

        chatService = new ChatService(
                geminiClient,
                ragService,
                chatMessageRepository,
                faceScanRepository,
                voiceMoodScanRepository,
                profileRepository
        );
    }

    @Test
    @DisplayName("Chat 1: Valid Chat Request Execution")
    void testValidRequest() {
        when(ragService.retrieveRelevantChunks(anyString(), anyDouble(), anyInt())).thenReturn(List.of());
        when(chatMessageRepository.findTop20BySessionIdOrderByCreatedAtDesc(anyString())).thenReturn(List.of());
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenReturn("Hello! I am Ruhi, here to support you.");

        Profile profile = Profile.builder().id(UUID.randomUUID()).name("Test User").build();
        ChatService.ChatResponse response = chatService.processChatRequest("Hello Ruhi", "session-1", profile);

        assertNotNull(response);
        assertEquals("Hello! I am Ruhi, here to support you.", response.reply());
        assertFalse(response.crisisFlag());
        assertEquals(ChatService.ChatIntent.GENERAL, response.intent());
    }

    @Test
    @DisplayName("Chat 2: Invalid Request (Empty Content) Rejection")
    void testInvalidRequest() {
        Profile profile = Profile.builder().id(UUID.randomUUID()).build();
        assertThrows(IllegalArgumentException.class, () -> chatService.processChatRequest("", "session-1", profile));
        assertThrows(IllegalArgumentException.class, () -> chatService.processChatRequest(null, "session-1", profile));
    }

    @Test
    @DisplayName("Chat 3: History Bounded Window Limit (Max 20 Messages)")
    void testHistoryLimit() {
        List<ChatMessage> mockHistory = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            mockHistory.add(ChatMessage.builder().sessionId("session-1").role("user").content("Message " + i).build());
        }

        when(chatMessageRepository.findTop20BySessionIdOrderByCreatedAtDesc("session-1")).thenReturn(mockHistory);
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean())).thenReturn("Response after history window.");

        Profile profile = Profile.builder().id(UUID.randomUUID()).name("Test User").build();
        ChatService.ChatResponse response = chatService.processChatRequest("How are you?", "session-1", profile);

        assertNotNull(response);
        verify(chatMessageRepository, times(1)).findTop20BySessionIdOrderByCreatedAtDesc("session-1");
    }

    @Test
    @DisplayName("Chat 4: Gemini LLM Failure Handling")
    void testGeminiFailure() {
        when(ragService.retrieveRelevantChunks(anyString(), anyDouble(), anyInt())).thenReturn(List.of());
        when(chatMessageRepository.findTop20BySessionIdOrderByCreatedAtDesc(anyString())).thenReturn(List.of());
        when(geminiClient.generateContent(anyString(), anyString(), anyBoolean()))
                .thenThrow(new RuntimeException("Gemini API 503 Service Unavailable"));

        Profile profile = Profile.builder().id(UUID.randomUUID()).build();
        assertThrows(RuntimeException.class, () -> chatService.processChatRequest("Hello", "session-1", profile));
    }
}
