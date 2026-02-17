package com.easyapply.repository;

import com.easyapply.entity.CV;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CVRepository extends JpaRepository<CV, Long> {

    List<CV> findByUserId(UUID userId);

    Optional<CV> findByIdAndUserId(Long id, UUID userId);
}
