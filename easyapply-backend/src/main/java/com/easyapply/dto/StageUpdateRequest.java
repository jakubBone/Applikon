package com.easyapply.dto;

import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;

public class StageUpdateRequest {

    private ApplicationStatus status;
    private String currentStage;
    private RejectionReason rejectionReason;
    private String rejectionDetails;

    // Getters and Setters
    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getCurrentStage() {
        return currentStage;
    }

    public void setCurrentStage(String currentStage) {
        this.currentStage = currentStage;
    }

    public RejectionReason getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(RejectionReason rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getRejectionDetails() {
        return rejectionDetails;
    }

    public void setRejectionDetails(String rejectionDetails) {
        this.rejectionDetails = rejectionDetails;
    }
}
