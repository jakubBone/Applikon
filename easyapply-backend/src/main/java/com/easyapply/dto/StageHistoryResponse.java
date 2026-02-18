package com.easyapply.dto;

import com.easyapply.entity.StageHistory;

import java.time.LocalDateTime;

public record StageHistoryResponse(
        Long id,
        String stageName,
        boolean completed,
        LocalDateTime createdAt,
        LocalDateTime completedAt) {

    public static StageHistoryResponse fromEntity(StageHistory stageHistory) {
        return new StageHistoryResponse(
                stageHistory.getId(),
                stageHistory.getStageName(),
                stageHistory.isCompleted(),
                stageHistory.getCreatedAt(),
                stageHistory.getCompletedAt()
        );
    }
}
