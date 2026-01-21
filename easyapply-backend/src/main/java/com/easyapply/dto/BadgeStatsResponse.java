package com.easyapply.dto;

public class BadgeStatsResponse {
    private BadgeResponse rejectionBadge;
    private BadgeResponse ghostingBadge;
    private boolean sweetRevengeUnlocked;
    private int totalRejections;
    private int totalGhosting;
    private int totalOffers;

    public BadgeStatsResponse() {}

    public BadgeResponse getRejectionBadge() { return rejectionBadge; }
    public void setRejectionBadge(BadgeResponse rejectionBadge) { this.rejectionBadge = rejectionBadge; }

    public BadgeResponse getGhostingBadge() { return ghostingBadge; }
    public void setGhostingBadge(BadgeResponse ghostingBadge) { this.ghostingBadge = ghostingBadge; }

    public boolean isSweetRevengeUnlocked() { return sweetRevengeUnlocked; }
    public void setSweetRevengeUnlocked(boolean sweetRevengeUnlocked) { this.sweetRevengeUnlocked = sweetRevengeUnlocked; }

    public int getTotalRejections() { return totalRejections; }
    public void setTotalRejections(int totalRejections) { this.totalRejections = totalRejections; }

    public int getTotalGhosting() { return totalGhosting; }
    public void setTotalGhosting(int totalGhosting) { this.totalGhosting = totalGhosting; }

    public int getTotalOffers() { return totalOffers; }
    public void setTotalOffers(int totalOffers) { this.totalOffers = totalOffers; }
}
