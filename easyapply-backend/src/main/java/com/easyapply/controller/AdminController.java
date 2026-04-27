package com.easyapply.controller;

import com.easyapply.dto.ServiceNoticeRequest;
import com.easyapply.dto.ServiceNoticeResponse;
import com.easyapply.service.ServiceNoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ServiceNoticeService service;

    public AdminController(ServiceNoticeService service) {
        this.service = service;
    }

    @PostMapping("/notices")
    public ResponseEntity<ServiceNoticeResponse> createNotice(
            @Valid @RequestBody ServiceNoticeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request));
    }
}
