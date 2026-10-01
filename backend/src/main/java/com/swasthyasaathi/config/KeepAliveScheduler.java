package com.swasthyasaathi.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@EnableScheduling
public class KeepAliveScheduler {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveScheduler.class);

    @Value("${app.service-url:http://localhost:8081}")
    private String serviceUrl;

    private final RestClient restClient;

    public KeepAliveScheduler() {
        this.restClient = RestClient.builder().build();
    }

    /**
     * Self-keepalive heartbeat:
     * Pings /actuator/health every 10 minutes (600,000 ms) to prevent Render free tier inactivity shutdown.
     */
    @Scheduled(fixedRate = 600000, initialDelay = 60000)
    public void pingSelf() {
        try {
            String healthUrl = serviceUrl.endsWith("/") ? serviceUrl + "actuator/health" : serviceUrl + "/actuator/health";
            String response = restClient.get()
                    .uri(healthUrl)
                    .retrieve()
                    .body(String.class);
            log.info("KeepAlive heartbeat ping to {} successful", healthUrl);
        } catch (Exception e) {
            log.warn("KeepAlive ping notice: {}", e.getMessage());
        }
    }
}
