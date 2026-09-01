package com.swasthyasaathi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class SwasthyaSaathiApplication {
    public static void main(String[] args) {
        // Automatically load parent directory's .env file into System properties for easy local development
        try {
            Path envPath = Paths.get("../.env");
            if (Files.exists(envPath)) {
                Files.readAllLines(envPath).forEach(line -> {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                        int eqIdx = trimmed.indexOf('=');
                        String key = trimmed.substring(0, eqIdx).trim();
                        String val = trimmed.substring(eqIdx + 1).trim();
                        
                        // Strip enclosing quotes
                        if ((val.startsWith("\"") && val.endsWith("\"")) || 
                            (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        
                        System.setProperty(key, val);
                    }
                });
                System.out.println("🌱 Loaded credentials from root .env file successfully.");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not parse root .env file: " + e.getMessage());
        }

        SpringApplication.run(SwasthyaSaathiApplication.class, args);
    }
}

