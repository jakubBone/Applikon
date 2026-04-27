package com.easyapply.dto;

public record ServiceNoticeResponse(
        Long id,
        String type,
        String messagePl,
        String messageEn,
        String expiresAt
) {}
