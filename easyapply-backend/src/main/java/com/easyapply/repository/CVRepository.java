package com.easyapply.repository;

import com.easyapply.entity.CV;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CVRepository extends JpaRepository<CV, Long> {

    // Metody z filtrowaniem po sessionId
    List<CV> findBySessionId(String sessionId);

    Optional<CV> findByIdAndSessionId(Long id, String sessionId);
}
