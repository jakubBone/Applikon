package com.easyapply.controller;

import com.easyapply.dto.ServiceNoticeResponse;
import com.easyapply.service.ServiceNoticeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final ServiceNoticeService service;

    public SystemController(ServiceNoticeService service) {
        this.service = service;
    }

    @GetMapping("/notices/active")
    public List<ServiceNoticeResponse> getActiveNotices() {
        return service.findActive();
    }
}
