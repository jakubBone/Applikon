package com.easyapply.repository;

import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"stageHistory"})
    @Query("SELECT a FROM Application a WHERE a.user.id = :userId ORDER BY a.appliedAt DESC")
    List<Application> findByUserIdWithStageHistory(@Param("userId") UUID userId);

    List<Application> findByUserIdAndCompanyIgnoreCaseAndPositionIgnoreCase(
            UUID userId, String company, String position);

    Optional<Application> findByIdAndUserId(Long id, UUID userId);

    boolean existsByIdAndUserId(Long id, UUID userId);

    @Query("SELECT " +
            "SUM(CASE WHEN a.status = :odmowa THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = :odmowa AND a.rejectionReason = :ghosting THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = :oferta THEN 1 ELSE 0 END) " +
            "FROM Application a WHERE a.user.id = :userId")
    Object[] getApplicationStats(
            @Param("userId") UUID userId,
            @Param("odmowa") ApplicationStatus odmowa,
            @Param("oferta") ApplicationStatus oferta,
            @Param("ghosting") RejectionReason ghosting);

    @Modifying
    @Query("UPDATE Application a SET a.cv = null WHERE a.cv.id = :cvId")
    void clearCVReferences(@Param("cvId") Long cvId);
}
