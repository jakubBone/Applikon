package com.easyapply.dto;

public record BadgeResponse(
        String name,
        String icon,
        String description,
        int threshold,
        int currentCount,
        Integer nextThreshold,
        String nextBadgeName) {}
