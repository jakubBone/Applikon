package com.easyapply.repository;

import com.easyapply.entity.StageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StageHistoryRepository extends JpaRepository<StageHistory, Long> {
    List<StageHistory> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);
    void deleteByApplicationId(Long applicationId);
}
