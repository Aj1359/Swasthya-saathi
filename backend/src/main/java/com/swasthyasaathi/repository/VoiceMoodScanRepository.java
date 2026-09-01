package com.swasthyasaathi.repository;

import com.swasthyasaathi.model.Profile;
import com.swasthyasaathi.model.VoiceMoodScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VoiceMoodScanRepository extends JpaRepository<VoiceMoodScan, UUID> {
    List<VoiceMoodScan> findByProfileOrderByCreatedAtDesc(Profile profile);
}
