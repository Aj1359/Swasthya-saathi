package com.swasthyasaathi.ratelimit;

import com.swasthyasaathi.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);

    // In-Memory Token Bucket implementation (Ready for Redis upgrade on Day 4)
    private static final int MAX_REQUESTS_PER_MINUTE = 30;
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public void checkRateLimit(String key) {
        if (key == null || key.isBlank()) {
            key = "anonymous";
        }
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(MAX_REQUESTS_PER_MINUTE, 60000));
        if (!bucket.tryConsume()) {
            log.warn("Rate limit boundary triggered for client_hash={}", Integer.toHexString(key.hashCode()));
            throw new RateLimitExceededException("Rate limit exceeded (30 requests/min). Please wait before trying again.");
        }
    }

    private static class TokenBucket {
        private final int capacity;
        private final long windowMillis;
        private int tokens;
        private long lastRefillTimestamp;

        public TokenBucket(int capacity, long windowMillis) {
            this.capacity = capacity;
            this.windowMillis = windowMillis;
            this.tokens = capacity;
            this.lastRefillTimestamp = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - lastRefillTimestamp > windowMillis) {
                tokens = capacity;
                lastRefillTimestamp = now;
            }
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }
    }
}
