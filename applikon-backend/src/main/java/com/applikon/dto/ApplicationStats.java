package com.applikon.dto;

public record ApplicationStats(Long rejectionCount, Long ghostingCount, Long offerCount) {

    public int rejections() {
        return rejectionCount != null ? rejectionCount.intValue() : 0;
    }

    public int ghosting() {
        return ghostingCount != null ? ghostingCount.intValue() : 0;
    }

    public int offers() {
        return offerCount != null ? offerCount.intValue() : 0;
    }
}
