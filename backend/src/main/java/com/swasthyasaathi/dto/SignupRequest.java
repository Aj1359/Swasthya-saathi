package com.swasthyasaathi.dto;

import java.util.List;

public record SignupRequest(
    String email,
    String password,
    String name,
    String gender,
    Integer age,
    String occupation,
    String country,
    List<String> collegeStressors
) {}
