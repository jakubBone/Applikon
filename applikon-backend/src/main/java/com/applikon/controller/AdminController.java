package com.applikon.controller;

import com.applikon.dto.ServiceNoticeRequest;
import com.applikon.dto.ServiceNoticeResponse;
import com.applikon.service.ServiceNoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin", description = "Service notices management — requires X-Admin-Key header")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ServiceNoticeService service;

    public AdminController(ServiceNoticeService service) {
        this.service = service;
    }

    @Operation(summary = "Create a service notice (BANNER or MODAL)",
               description = "Requires X-Admin-Key header. Active notices are shown to all logged-in users.")
    @PostMapping("/notices")
    public ResponseEntity<ServiceNoticeResponse> createNotice(
            @Valid @RequestBody ServiceNoticeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }
}
