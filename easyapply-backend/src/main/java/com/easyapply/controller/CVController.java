package com.easyapply.controller;

import com.easyapply.entity.CV;
import com.easyapply.entity.CVType;
import com.easyapply.security.AuthenticatedUser;
import com.easyapply.service.CVService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
            @RequestParam("file") MultipartFile file) throws IOException {
        CV cv = cvService.uploadCV(file, user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(CVResponse.fromEntity(cv));
    }

    @GetMapping
    public ResponseEntity<List<CVResponse>> findAll(@AuthenticationPrincipal AuthenticatedUser user) {
        List<CVResponse> cvs = cvService.findAllByUserId(user.id()).stream()
                .map(CVResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(cvs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CVResponse> findById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        return ResponseEntity.ok(CVResponse.fromEntity(cvService.findById(id, user.id())));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) throws MalformedURLException {
        CV cv = cvService.findById(id, user.id());
        Resource resource = cvService.downloadCV(id, user.id());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + cv.getOriginalFileName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        cvService.deleteCV(id, user.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<CVResponse> createCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CVCreateRequest request) {
        CV cv = cvService.createCV(request.name(), request.type(), request.externalUrl(), user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(CVResponse.fromEntity(cv));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CVResponse> updateCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody CVUpdateRequest request) {
        CV cv = cvService.updateCV(id, request.name(), request.externalUrl(), user.id());
        return ResponseEntity.ok(CVResponse.fromEntity(cv));
    }

    public record CVCreateRequest(
            @NotBlank(message = "Nazwa CV nie może być pusta") String name,
            CVType type,
            String externalUrl) {}

    public record CVUpdateRequest(
            @NotBlank(message = "Nazwa CV nie może być pusta") String name,
            String externalUrl) {}

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
