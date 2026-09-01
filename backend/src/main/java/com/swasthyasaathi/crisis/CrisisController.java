package com.swasthyasaathi.crisis;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crisis")
public class CrisisController {

    @GetMapping("/helplines")
    public ResponseEntity<?> getHelplines() {
        // Return a structured list of emergency contacts/mental health support lines
        List<Map<String, Object>> helplines = List.of(
            Map.of(
                "country", "India",
                "contacts", List.of(
                    Map.of("name", "iCall (TISS)", "number", "9152987821", "type", "Mental Health Support"),
                    Map.of("name", "KIRAN", "number", "1800-599-0019", "type", "Government Helpline"),
                    Map.of("name", "AASRA", "number", "91-9820466726", "type", "Suicide Prevention"),
                    Map.of("name", "Vandrevala Foundation", "number", "9999 666 555", "type", "Crisis Helpline")
                )
            ),
            Map.of(
                "country", "United States",
                "contacts", List.of(
                    Map.of("name", "Suicide & Crisis Lifeline", "number", "988", "type", "National Crisis"),
                    Map.of("name", "Crisis Text Line", "number", "Text HOME to 741741", "type", "Text Support"),
                    Map.of("name", "The Trevor Project (LGBTQ+)", "number", "1-866-488-7386", "type", "Crisis Support")
                )
            ),
            Map.of(
                "country", "United Kingdom",
                "contacts", List.of(
                    Map.of("name", "Samaritans", "number", "116 123", "type", "Suicide Prevention"),
                    Map.of("name", "Shout Crisis Text Line", "number", "Text SHOUT to 85258", "type", "Text Support")
                )
            )
        );

        return ResponseEntity.ok(helplines);
    }
}
