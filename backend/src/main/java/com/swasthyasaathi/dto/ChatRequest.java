package com.swasthyasaathi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatRequest(
    @NotBlank(message = "Message content is required")
    @Size(max = 4000, message = "Message content cannot exceed 4000 characters")
    String content,

    @NotBlank(message = "Session ID is required")
    String sessionId
) {}
