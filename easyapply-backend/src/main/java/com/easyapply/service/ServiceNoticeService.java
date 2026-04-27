package com.easyapply.service;

import com.easyapply.dto.ServiceNoticeRequest;
import com.easyapply.dto.ServiceNoticeResponse;
import com.easyapply.entity.ServiceNotice;
import com.easyapply.entity.ServiceNoticeType;
import com.easyapply.repository.ServiceNoticeRepository;
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
