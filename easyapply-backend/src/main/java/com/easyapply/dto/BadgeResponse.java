package com.easyapply.dto;

public class BadgeResponse {
    private String name;
    private String icon;
    private String description;
    private int threshold;
    private int currentCount;
    private Integer nextThreshold;
    private String nextBadgeName;

    public BadgeResponse() {}

    public BadgeResponse(String name, String icon, String description, int threshold, int currentCount, Integer nextThreshold, String nextBadgeName) {
        this.name = name;
        this.icon = icon;
        this.description = description;
        this.threshold = threshold;
        this.currentCount = currentCount;
        this.nextThreshold = nextThreshold;
        this.nextBadgeName = nextBadgeName;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getThreshold() { return threshold; }
    public void setThreshold(int threshold) { this.threshold = threshold; }

    public int getCurrentCount() { return currentCount; }
    public void setCurrentCount(int currentCount) { this.currentCount = currentCount; }

    public Integer getNextThreshold() { return nextThreshold; }
    public void setNextThreshold(Integer nextThreshold) { this.nextThreshold = nextThreshold; }

    public String getNextBadgeName() { return nextBadgeName; }
    public void setNextBadgeName(String nextBadgeName) { this.nextBadgeName = nextBadgeName; }
}
