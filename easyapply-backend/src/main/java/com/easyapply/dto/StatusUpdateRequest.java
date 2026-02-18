package com.easyapply.dto;

import com.easyapply.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status nie może być pusty") ApplicationStatus status) {}
