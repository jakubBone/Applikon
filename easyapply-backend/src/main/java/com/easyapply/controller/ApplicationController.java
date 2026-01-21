package com.easyapply.controller;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StatusUpdateRequest;
import com.easyapply.dto.StageUpdateRequest;
import com.easyapply.service.ApplicationService;
import com.easyapply.service.CVService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
            @RequestHeader("X-Session-ID") String sessionId,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.create(request, sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> findAll(
            @RequestHeader("X-Session-ID") String sessionId) {
        List<ApplicationResponse> applications = applicationService.findAllBySessionId(sessionId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> findById(@PathVariable Long id) {
        ApplicationResponse response = applicationService.findById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        ApplicationResponse response = applicationService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<List<ApplicationResponse>> checkDuplicate(
            @RequestHeader("X-Session-ID") String sessionId,
            @RequestParam String company,
            @RequestParam String position) {
        List<ApplicationResponse> duplicates = applicationService.findDuplicates(sessionId, company, position);
        return ResponseEntity.ok(duplicates);
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
        ApplicationResponse response = applicationService.findById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> updateStage(
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest request) {
        ApplicationResponse response = applicationService.updateStage(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> addStage(
            @PathVariable Long id,
            @RequestBody AddStageRequest request) {
        ApplicationResponse response = applicationService.addStage(id, request.stageName());
        return ResponseEntity.ok(response);
    }

    public record AssignCVRequest(Long cvId) {}
    public record AddStageRequest(String stageName) {}
}
