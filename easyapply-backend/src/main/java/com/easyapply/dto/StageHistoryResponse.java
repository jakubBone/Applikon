package com.easyapply.dto;

import com.easyapply.entity.StageHistory;

import java.time.LocalDateTime;

public class StageHistoryResponse {

    private Long id;
    private String stageName;
    private boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public StageHistoryResponse() {}

    public static StageHistoryResponse fromEntity(StageHistory stageHistory) {
        StageHistoryResponse response = new StageHistoryResponse();
        response.setId(stageHistory.getId());
        response.setStageName(stageHistory.getStageName());
        response.setCompleted(stageHistory.isCompleted());
        response.setCreatedAt(stageHistory.getCreatedAt());
        response.setCompletedAt(stageHistory.getCompletedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStageName() {
        return stageName;
    }

    public void setStageName(String stageName) {
        this.stageName = stageName;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
