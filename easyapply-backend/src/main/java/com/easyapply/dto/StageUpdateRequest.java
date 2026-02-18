package com.easyapply.dto;

import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;

public record StageUpdateRequest(
        ApplicationStatus status,
        String currentStage,
        RejectionReason rejectionReason,
        String rejectionDetails) {}
