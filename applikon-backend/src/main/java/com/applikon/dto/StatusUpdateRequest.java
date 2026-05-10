package com.applikon.dto;

import com.applikon.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "{validation.status.required}") ApplicationStatus status) {}
