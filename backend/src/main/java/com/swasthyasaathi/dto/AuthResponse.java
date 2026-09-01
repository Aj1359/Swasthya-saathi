package com.swasthyasaathi.dto;

import com.swasthyasaathi.model.Profile;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    Profile user
) {}
