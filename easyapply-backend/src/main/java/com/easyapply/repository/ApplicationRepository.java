package com.easyapply.repository;

import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByUserId(UUID userId);

    List<Application> findByUserIdAndCompanyIgnoreCaseAndPositionIgnoreCase(
            UUID userId, String company, String position);

    long countByUserIdAndStatusIn(UUID userId, List<ApplicationStatus> statuses);

    long countByUserIdAndStatusInAndRejectionReason(
            UUID userId, List<ApplicationStatus> statuses, RejectionReason reason);

    @Modifying
    @Query("UPDATE Application a SET a.cv = null WHERE a.cv.id = :cvId")
    void clearCVReferences(@Param("cvId") Long cvId);
}
