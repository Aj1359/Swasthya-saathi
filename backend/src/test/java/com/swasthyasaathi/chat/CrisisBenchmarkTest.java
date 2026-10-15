package com.swasthyasaathi.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swasthyasaathi.gemini.GeminiClient;
import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.rag.RagService;
import com.swasthyasaathi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CrisisBenchmarkTest {

    private ChatService chatService;
    private GeminiClient geminiClient;
    private RagService ragService;
    private ChatMessageRepository chatMessageRepository;
    private FaceScanRepository faceScanRepository;
    private VoiceMoodScanRepository voiceMoodScanRepository;
    private ProfileRepository profileRepository;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        ragService = mock(RagService.class);
        chatMessageRepository = mock(ChatMessageRepository.class);
        faceScanRepository = mock(FaceScanRepository.class);
        voiceMoodScanRepository = mock(VoiceMoodScanRepository.class);
        profileRepository = mock(ProfileRepository.class);

        chatService = new ChatService(
                geminiClient,
                ragService,
                chatMessageRepository,
                faceScanRepository,
                voiceMoodScanRepository,
                profileRepository
        );
    }

    @Test
    @DisplayName("Benchmark Crisis Detection: 50 Distress & 50 Benign Prompts")
    void benchmarkCrisisDetection() throws Exception {
        Path csvPath = Paths.get("..", "metrics", "crisis_set.csv");
        if (!Files.exists(csvPath)) {
            csvPath = Paths.get("metrics", "crisis_set.csv");
        }
        assertTrue(Files.exists(csvPath), "crisis_set.csv must exist at: " + csvPath.toAbsolutePath());

        Path rawOutputDir = Paths.get("..", "metrics", "raw");
        if (!Files.exists(rawOutputDir)) {
            rawOutputDir = Paths.get("metrics", "raw");
        }
        Files.createDirectories(rawOutputDir);
        Path rawOutputFile = rawOutputDir.resolve("crisis_detection_improved_raw.txt");
        Path summaryFile = rawOutputDir.resolve("crisis_detection_improved_summary.json");

        List<String> rawLogLines = new ArrayList<>();
        rawLogLines.add(String.format("CRISIS BENCHMARK EXECUTION - %s", new Date()));
        rawLogLines.add("===============================================================================");
        rawLogLines.add(String.format("%-4s | %-16s | %-8s | %-8s | %-6s | %s", "ID", "CATEGORY", "EXPECTED", "DETECTED", "RESULT", "PHRASE"));
        rawLogLines.add("-------------------------------------------------------------------------------");

        int totalPrompts = 0;
        int truePositives = 0;
        int falseNegatives = 0;
        int trueNegatives = 0;
        int falsePositives = 0;

        List<Map<String, Object>> missedDistress = new ArrayList<>();
        List<Map<String, Object>> falseAlarms = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new FileReader(csvPath.toFile()))) {
            String header = reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                totalPrompts++;

                // Parse CSV line (handle quotes)
                int firstComma = line.indexOf(',');
                int lastComma = line.lastIndexOf(',');
                int secondToLastComma = line.lastIndexOf(',', lastComma - 1);

                int id = Integer.parseInt(line.substring(0, firstComma).trim());
                String expectedStr = line.substring(lastComma + 1).trim();
                boolean expectedCrisis = Boolean.parseBoolean(expectedStr);
                String category = line.substring(secondToLastComma + 1, lastComma).trim();
                String phrase = line.substring(firstComma + 1, secondToLastComma).trim();
                if (phrase.startsWith("\"") && phrase.endsWith("\"")) {
                    phrase = phrase.substring(1, phrase.length() - 1);
                }

                // Reset mock invocations to verify LLM bypass
                reset(geminiClient);

                ChatService.ChatResponse response = chatService.processChatRequest(phrase, "bench-session-" + id, null);
                boolean detectedCrisis = response.crisisFlag() && response.intent() == ChatService.ChatIntent.CRISIS;

                String verdict;
                if (expectedCrisis && detectedCrisis) {
                    truePositives++;
                    verdict = "TP (HIT)";
                    // Confirm LLM was bypassed
                    verifyNoInteractions(geminiClient);
                    // Confirm helpline returned
                    assertTrue(response.reply().contains("14416") || response.reply().contains("1800-599-0019"),
                            "Crisis reply must contain emergency helplines");
                } else if (expectedCrisis && !detectedCrisis) {
                    falseNegatives++;
                    verdict = "FN (MISS)";
                    missedDistress.add(Map.of("id", id, "phrase", phrase, "category", category));
                } else if (!expectedCrisis && detectedCrisis) {
                    falsePositives++;
                    verdict = "FP (ALARM)";
                    falseAlarms.add(Map.of("id", id, "phrase", phrase, "category", category));
                } else {
                    trueNegatives++;
                    verdict = "TN (CORRECT)";
                }

                rawLogLines.add(String.format("%-4d | %-16s | %-8s | %-8s | %-6s | %s",
                        id, category, expectedCrisis, detectedCrisis, verdict, phrase));
            }
        }

        double recall = (double) truePositives / (truePositives + falseNegatives);
        double falsePositiveRate = (double) falsePositives / (falsePositives + trueNegatives);
        double precision = (truePositives + falsePositives) > 0 ? (double) truePositives / (truePositives + falsePositives) : 0;
        double accuracy = (double) (truePositives + trueNegatives) / totalPrompts;

        rawLogLines.add("===============================================================================");
        rawLogLines.add(String.format("TOTAL SAMPLES: %d (Distress: %d, Benign: %d)", totalPrompts, (truePositives + falseNegatives), (trueNegatives + falsePositives)));
        rawLogLines.add(String.format("TRUE POSITIVES (TP): %d", truePositives));
        rawLogLines.add(String.format("FALSE NEGATIVES (FN - Missed Distress): %d", falseNegatives));
        rawLogLines.add(String.format("TRUE NEGATIVES (TN): %d", trueNegatives));
        rawLogLines.add(String.format("FALSE POSITIVES (FP - False Alarms): %d", falsePositives));
        rawLogLines.add(String.format("RECALL: %.4f (%.2f%%)", recall, recall * 100.0));
        rawLogLines.add(String.format("FALSE POSITIVE RATE: %.4f (%.2f%%)", falsePositiveRate, falsePositiveRate * 100.0));
        rawLogLines.add(String.format("PRECISION: %.4f (%.2f%%)", precision, precision * 100.0));
        rawLogLines.add(String.format("ACCURACY: %.4f (%.2f%%)", accuracy, accuracy * 100.0));
        rawLogLines.add("-------------------------------------------------------------------------------");
        rawLogLines.add("MISSED DISTRESS PHRASES (FALSE NEGATIVES):");
        for (Map<String, Object> miss : missedDistress) {
            rawLogLines.add(String.format("  - [ID %s | %s] %s", miss.get("id"), miss.get("category"), miss.get("phrase")));
        }
        rawLogLines.add("-------------------------------------------------------------------------------");
        rawLogLines.add("FALSE ALARMS (FALSE POSITIVES):");
        for (Map<String, Object> fa : falseAlarms) {
            rawLogLines.add(String.format("  - [ID %s | %s] %s", fa.get("id"), fa.get("category"), fa.get("phrase")));
        }
        rawLogLines.add("===============================================================================");

        Files.write(rawOutputFile, rawLogLines);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("timestamp", new Date().toString());
        summary.put("total_samples", totalPrompts);
        summary.put("distress_samples", truePositives + falseNegatives);
        summary.put("benign_samples", trueNegatives + falsePositives);
        summary.put("true_positives", truePositives);
        summary.put("false_negatives", falseNegatives);
        summary.put("true_negatives", trueNegatives);
        summary.put("false_positives", falsePositives);
        summary.put("recall", recall);
        summary.put("false_positive_rate", falsePositiveRate);
        summary.put("precision", precision);
        summary.put("accuracy", accuracy);
        summary.put("missed_distress_count", missedDistress.size());
        summary.put("missed_distress_phrases", missedDistress);
        summary.put("false_alarms_count", falseAlarms.size());
        summary.put("false_alarms_phrases", falseAlarms);

        ObjectMapper mapper = new ObjectMapper();
        mapper.writerWithDefaultPrettyPrinter().writeValue(summaryFile.toFile(), summary);

        System.out.println("Crisis Benchmark Completed. Raw output: " + rawOutputFile.toAbsolutePath());
        System.out.println("Recall: " + (recall * 100.0) + "%, FPR: " + (falsePositiveRate * 100.0) + "%");
    }
}
