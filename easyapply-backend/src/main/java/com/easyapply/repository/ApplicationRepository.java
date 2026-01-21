package com.easyapply.repository;

import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Metody z filtrowaniem po sessionId
    List<Application> findBySessionId(String sessionId);

    List<Application> findBySessionIdAndCompanyIgnoreCaseAndPositionIgnoreCase(
            String sessionId, String company, String position);

    long countBySessionIdAndStatusIn(String sessionId, List<ApplicationStatus> statuses);

    long countBySessionIdAndStatusInAndRejectionReason(
            String sessionId, List<ApplicationStatus> statuses, RejectionReason reason);

    // Metody bez sessionId (dla kompatybilności wstecznej i migracji)
    List<Application> findByCompanyIgnoreCaseAndPositionIgnoreCase(String company, String position);

    @Modifying
    @Query("UPDATE Application a SET a.cv = null WHERE a.cv.id = :cvId")
    void clearCVReferences(@Param("cvId") Long cvId);

    long countByStatusIn(List<ApplicationStatus> statuses);

    long countByStatusInAndRejectionReason(List<ApplicationStatus> statuses, RejectionReason reason);
}
