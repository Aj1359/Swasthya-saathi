package com.swasthyasaathi.auth;

import com.swasthyasaathi.dto.AuthResponse;
import com.swasthyasaathi.dto.LoginRequest;
import com.swasthyasaathi.dto.SignupRequest;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.repository.ProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public AuthController(AuthenticationManager authenticationManager,
                          ProfileRepository profileRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          CustomUserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (profileRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email is already in use"));
        }

        Profile profile = Profile.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name())
                .gender(request.gender())
                .age(request.age())
                .occupation(request.occupation())
                .country(request.country())
                .collegeStressors(request.collegeStressors() != null ? request.collegeStressors() : java.util.Collections.emptyList())
                .build();

        Profile savedProfile = profileRepository.save(profile);
        UserPrincipal principal = new UserPrincipal(savedProfile);
        
        String accessToken = jwtUtil.generateToken(principal);
        String refreshToken = jwtUtil.generateRefreshToken(principal);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(accessToken, refreshToken, savedProfile));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserByUsername(request.email());
        String accessToken = jwtUtil.generateToken(principal);
        String refreshToken = jwtUtil.generateRefreshToken(principal);

        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken, principal.getProfile()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Refresh token is required"));
        }

        try {
            String email = jwtUtil.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (jwtUtil.validateToken(refreshToken, userDetails)) {
                UserPrincipal principal = (UserPrincipal) userDetails;
                String newAccessToken = jwtUtil.generateToken(principal);
                String newRefreshToken = jwtUtil.generateRefreshToken(principal); // Issue new refresh token
                return ResponseEntity.ok(new AuthResponse(newAccessToken, newRefreshToken, principal.getProfile()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid refresh token: " + e.getMessage()));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid or expired refresh token"));
    }
}
