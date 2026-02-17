package com.easyapply.controller;

import com.easyapply.entity.CV;
import com.easyapply.entity.CVType;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.service.CVService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;

@RestController
@RequestMapping("/api/cv")
public class CVController {

    private final CVService cvService;

    public CVController(CVService cvService) {
        this.cvService = cvService;
    }

    @PostMapping("/upload")
    public ResponseEntity<CVResponse> uploadCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam("file") MultipartFile file) {
        try {
            CV cv = cvService.uploadCV(file, user.id());
            return ResponseEntity.status(HttpStatus.CREATED).body(CVResponse.fromEntity(cv));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<CVResponse>> findAll(@AuthenticationPrincipal AuthenticatedUser user) {
        List<CVResponse> cvs = cvService.findAllByUserId(user.id()).stream()
                .map(CVResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(cvs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CVResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(CVResponse.fromEntity(cvService.findById(id)));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadCV(@PathVariable Long id) {
        try {
            CV cv = cvService.findById(id);
            Resource resource = cvService.downloadCV(id);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + cv.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCV(@PathVariable Long id) {
        cvService.deleteCV(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<CVResponse> createCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody CVCreateRequest request) {
        try {
            CV cv = cvService.createCV(request.name(), request.type(), request.externalUrl(), user.id());
            return ResponseEntity.status(HttpStatus.CREATED).body(CVResponse.fromEntity(cv));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CVResponse> updateCV(@PathVariable Long id, @RequestBody CVUpdateRequest request) {
        try {
            CV cv = cvService.updateCV(id, request.name(), request.externalUrl());
            return ResponseEntity.ok(CVResponse.fromEntity(cv));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    public record CVCreateRequest(String name, CVType type, String externalUrl) {}
    public record CVUpdateRequest(String name, String externalUrl) {}

    public record CVResponse(
            Long id,
            String fileName,
            String originalFileName,
            Long fileSize,
            String uploadedAt,
            CVType type,
            String externalUrl
    ) {
        public static CVResponse fromEntity(CV cv) {
            return new CVResponse(
                    cv.getId(),
                    cv.getFileName(),
                    cv.getOriginalFileName(),
                    cv.getFileSize(),
                    cv.getUploadedAt() != null ? cv.getUploadedAt().toString() : null,
                    cv.getType(),
                    cv.getExternalUrl()
            );
        }
    }
}
