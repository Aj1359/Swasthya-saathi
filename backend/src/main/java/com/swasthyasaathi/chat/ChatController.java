package com.swasthyasaathi.chat;

import com.swasthyasaathi.auth.UserPrincipal;
import com.swasthyasaathi.dto.ChatRequest;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.ratelimit.RateLimitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final RateLimitService rateLimitService;

    public ChatController(ChatService chatService, RateLimitService rateLimitService) {
        this.chatService = chatService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping
    public ResponseEntity<?> chat(@Valid @RequestBody ChatRequest request,
                                  @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String rateLimitKey = userPrincipal != null ? userPrincipal.getId().toString() : request.sessionId();
        rateLimitService.checkRateLimit(rateLimitKey);

        Profile profile = userPrincipal != null ? userPrincipal.getProfile() : null;

        ChatService.ChatResponse response = chatService.processChatRequest(
                request.content(),
                request.sessionId(),
                profile
        );

        return ResponseEntity.ok(Map.of(
            "reply", response.reply(),
            "retrievedSources", response.retrievedSources(),
            "sessionId", response.sessionId(),
            "crisisFlag", response.crisisFlag(),
            "intent", response.intent() != null ? response.intent().name() : "UNKNOWN"
        ));
    }
}
