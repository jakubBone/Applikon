package com.easyapply.dto;

import com.easyapply.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "{validation.status.required}") ApplicationStatus status) {}
