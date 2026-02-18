package com.easyapply.controller;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StatusUpdateRequest;
import com.easyapply.dto.StageUpdateRequest;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.service.ApplicationService;
import com.easyapply.service.CVService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CVService cvService;

    public ApplicationController(ApplicationService applicationService, CVService cvService) {
        this.applicationService = applicationService;
        this.cvService = cvService;
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.create(request, user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> findAll(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(applicationService.findAllByUserId(user.id()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.findById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateStatus(id, request.status()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(applicationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<List<ApplicationResponse>> checkDuplicate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam String company,
            @RequestParam String position) {
        return ResponseEntity.ok(applicationService.findDuplicates(user.id(), company, position));
    }

    @PatchMapping("/{id}/cv")
    public ResponseEntity<ApplicationResponse> assignCV(
            @PathVariable Long id,
            @RequestBody AssignCVRequest request) {
        if (request.cvId() == null) {
            cvService.removeCVFromApplication(id);
        } else {
            cvService.assignCVToApplication(id, request.cvId());
        }
        return ResponseEntity.ok(applicationService.findById(id));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> updateStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateStage(id, request));
    }

    @PostMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> addStage(
            @PathVariable Long id,
            @RequestBody AddStageRequest request) {
        return ResponseEntity.ok(applicationService.addStage(id, request.stageName()));
    }

    public record AssignCVRequest(Long cvId) {}
    public record AddStageRequest(String stageName) {}
}
