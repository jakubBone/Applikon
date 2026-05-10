package com.applikon.dto;

public record ServiceNoticeResponse(
        Long id,
        String type,
        String messagePl,
        String messageEn,
        String expiresAt
) {}
