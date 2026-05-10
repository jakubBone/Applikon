package com.applikon.service;

import com.applikon.dto.ServiceNoticeRequest;
import com.applikon.dto.ServiceNoticeResponse;
import com.applikon.entity.ServiceNotice;
import com.applikon.entity.ServiceNoticeType;
import com.applikon.repository.ServiceNoticeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ServiceNoticeService {

    private final ServiceNoticeRepository repository;

    public ServiceNoticeService(ServiceNoticeRepository repository) {
        this.repository = repository;
    }

    public List<ServiceNoticeResponse> findActive() {
        return repository.findActive(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ServiceNoticeResponse create(ServiceNoticeRequest request) {
        ServiceNotice notice = new ServiceNotice();
        notice.setType(ServiceNoticeType.valueOf(request.type()));
        notice.setMessagePl(request.messagePl());
        notice.setMessageEn(request.messageEn());
        if (request.expiresAt() != null) {
            notice.setExpiresAt(LocalDateTime.parse(request.expiresAt()));
        }
        return toResponse(repository.save(notice));
    }

    private ServiceNoticeResponse toResponse(ServiceNotice n) {
        return new ServiceNoticeResponse(
                n.getId(),
                n.getType().name(),
                n.getMessagePl(),
                n.getMessageEn(),
                n.getExpiresAt() != null ? n.getExpiresAt().toString() : null
        );
    }
}
