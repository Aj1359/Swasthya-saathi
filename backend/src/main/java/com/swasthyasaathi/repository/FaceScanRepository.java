package com.swasthyasaathi.repository;

import com.swasthyasaathi.model.FaceScan;
import com.swasthyasaathi.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FaceScanRepository extends JpaRepository<FaceScan, UUID> {
    List<FaceScan> findByProfileOrderByCreatedAtDesc(Profile profile);
}
