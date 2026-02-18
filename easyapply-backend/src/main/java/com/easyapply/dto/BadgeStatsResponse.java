package com.easyapply.dto;

public record BadgeStatsResponse(
        BadgeResponse rejectionBadge,
        BadgeResponse ghostingBadge,
        boolean sweetRevengeUnlocked,
        int totalRejections,
        int totalGhosting,
        int totalOffers) {}
