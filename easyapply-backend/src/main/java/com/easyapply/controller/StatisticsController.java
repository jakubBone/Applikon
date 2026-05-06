package com.easyapply.controller;

import com.easyapply.dto.BadgeStatsResponse;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.service.StatisticsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Statistics", description = "Badge stats and application metrics")
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/badges")
    public ResponseEntity<BadgeStatsResponse> getBadgeStats(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(statisticsService.getBadgeStats(user.id()));
    }
}
