package com.easyapply.dto;

import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.RejectionReason;
import jakarta.validation.constraints.NotNull;

public record StageUpdateRequest(
        @NotNull ApplicationStatus status,
        String currentStage,
        RejectionReason rejectionReason,
        String rejectionDetails) {}
