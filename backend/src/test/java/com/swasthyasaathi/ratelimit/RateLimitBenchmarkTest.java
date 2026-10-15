package com.swasthyasaathi.ratelimit;

import com.swasthyasaathi.exception.RateLimitExceededException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class RateLimitBenchmarkTest {

    @Test
    @DisplayName("Rate Limiter Threshold & Multi-User Isolation Verification")
    void testRateLimiterBurstAndIsolation() throws Exception {
        RateLimitService service = new RateLimitService();

        String userA = "user-uuid-aaaa-1111";
        String userB = "user-uuid-bbbb-2222";

        List<String> rawLog = new ArrayList<>();
        rawLog.add(String.format("RATE LIMITER VERIFICATION BENCHMARK - %s", new Date()));
        rawLog.add("===============================================================================");
        rawLog.add("Configured Limit: 30 requests per minute per key");
        rawLog.add("Testing: Burst threshold on User A, followed by isolation check on User B");
        rawLog.add("-------------------------------------------------------------------------------");

        int userASuccess = 0;
        int userABlocked = 0;
        int thresholdTriggerIndex = -1;

        // User A sends 35 requests in a burst
        for (int i = 1; i <= 35; i++) {
            try {
                service.checkRateLimit(userA);
                userASuccess++;
                rawLog.add(String.format("User A Request #%-2d -> ALLOWED (Tokens remaining consumed)", i));
            } catch (RateLimitExceededException e) {
                userABlocked++;
                if (thresholdTriggerIndex == -1) {
                    thresholdTriggerIndex = i;
                }
                rawLog.add(String.format("User A Request #%-2d -> BLOCKED (HTTP 429: %s)", i, e.getMessage()));
            }
        }

        assertEquals(30, userASuccess, "User A must be allowed exactly 30 requests");
        assertEquals(5, userABlocked, "User A must have exactly 5 requests blocked out of 35");
        assertEquals(31, thresholdTriggerIndex, "The 31st request must be the exact cutoff where 429 is triggered");

        rawLog.add("-------------------------------------------------------------------------------");
        rawLog.add("ISOLATION TEST: Checking User B while User A is in rate-limited state");

        int userBSuccess = 0;
        int userBBlocked = 0;

        // User B sends 30 requests
        for (int i = 1; i <= 30; i++) {
            try {
                service.checkRateLimit(userB);
                userBSuccess++;
                rawLog.add(String.format("User B Request #%-2d -> ALLOWED (Independent bucket)", i));
            } catch (RateLimitExceededException e) {
                userBBlocked++;
                rawLog.add(String.format("User B Request #%-2d -> BLOCKED", i));
            }
        }

        assertEquals(30, userBSuccess, "User B must have all 30 requests succeed independently");
        assertEquals(0, userBBlocked, "User B must not be affected by User A's exhaustion");

        // 31st request for User B should also fail
        boolean userBBlockedOn31 = false;
        try {
            service.checkRateLimit(userB);
        } catch (RateLimitExceededException e) {
            userBBlockedOn31 = true;
            rawLog.add(String.format("User B Request #31 -> BLOCKED (User B limit reached independently)"));
        }
        assertTrue(userBBlockedOn31, "User B request 31 must trigger rate limit independently");

        rawLog.add("===============================================================================");
        rawLog.add("SUMMARY OF RESULTS:");
        rawLog.add(String.format("  User A Requests Allowed: %d / 30", userASuccess));
        rawLog.add(String.format("  User A Cutoff Index: %d (Exact threshold: 429 on request #%d)", thresholdTriggerIndex, thresholdTriggerIndex));
        rawLog.add(String.format("  User B Allowed While User A Blocked: %d / 30 (100%% isolated)", userBSuccess));
        rawLog.add("  Cross-User Leakage / Interference: 0.00% (No shared bucket leakage)");
        rawLog.add("===============================================================================");

        Path rawDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawDir)) {
            rawDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawDir);
        Files.write(rawDir.resolve("rate_limiter_raw.txt"), rawLog);

        System.out.println("Rate Limiter Benchmark Passed. Exact threshold = 31st request rejected. Raw log written.");
    }
}
