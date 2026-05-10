package com.applikon.dto;

import com.applikon.entity.ApplicationStatus;
import com.applikon.entity.RejectionReason;
import jakarta.validation.constraints.NotNull;

public record StageUpdateRequest(
        @NotNull ApplicationStatus status,
        String currentStage,
        RejectionReason rejectionReason,
        String rejectionDetails) {}
