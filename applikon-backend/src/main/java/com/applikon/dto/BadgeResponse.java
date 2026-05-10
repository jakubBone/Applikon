package com.applikon.dto;

public record BadgeResponse(
        String name,
        String icon,
        String description,
        int threshold,
        int currentCount,
        Integer nextThreshold,
        String nextBadgeName) {}
