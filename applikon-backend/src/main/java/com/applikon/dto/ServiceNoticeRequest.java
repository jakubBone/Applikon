package com.applikon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ServiceNoticeRequest(
        @NotBlank
        @Pattern(regexp = "^(BANNER|MODAL)$", message = "type must be BANNER or MODAL")
        String type,
        @NotBlank String messagePl,
        @NotBlank String messageEn,
        String expiresAt
) {}
