package com.applikon.service;

import com.applikon.entity.Application;
import com.applikon.entity.CV;
import com.applikon.entity.CVType;
import com.applikon.entity.User;
import com.applikon.repository.ApplicationRepository;
import com.applikon.repository.CVRepository;
import com.applikon.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class CVService {

    private static final Logger log = LoggerFactory.getLogger(CVService.class);

    private final CVRepository cvRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;
    private final Path uploadDir;

    public CVService(
            CVRepository cvRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            MessageSource messageSource,
            @Value("${app.upload.dir:uploads/cv}") String uploadDir) {
        this.cvRepository = cvRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.messageSource = messageSource;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException(messageSource.getMessage("error.upload.dirCreate", null, java.util.Locale.ENGLISH), e);
        }
    }

    @Transactional
    public CV uploadCV(MultipartFile file, UUID userId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.empty", null, LocaleContextHolder.getLocale()));
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.pdfOnly", null, LocaleContextHolder.getLocale()));
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.tooLarge", null, LocaleContextHolder.getLocale()));
        }
        byte[] header = new byte[5];
        if (file.getInputStream().read(header) < 5
                || header[0] != 0x25 || header[1] != 0x50
                || header[2] != 0x44 || header[3] != 0x46
                || header[4] != 0x2D) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.pdfOnly", null, LocaleContextHolder.getLocale()));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.user.notFound", null, LocaleContextHolder.getLocale())));

        String originalFileName = file.getOriginalFilename();
        String fileName = UUID.randomUUID() + ".pdf";
        Path filePath = uploadDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Uploaded CV file={} for user={}", fileName, userId);

        CV cv = new CV();
        cv.setUser(user);
        cv.setType(CVType.FILE);
        cv.setFileName(fileName);
        cv.setOriginalFileName(originalFileName);
        cv.setFilePath(filePath.toString());
        cv.setFileSize(file.getSize());

        return cvRepository.save(cv);
    }

    @Transactional
    public CV createCV(String name, CVType type, String externalUrl, UUID userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.nameRequired", null, LocaleContextHolder.getLocale()));
        }
        if (type == CVType.FILE) {
            throw new IllegalArgumentException(messageSource.getMessage("error.cv.useUpload", null, LocaleContextHolder.getLocale()));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.user.notFound", null, LocaleContextHolder.getLocale())));

        CV cv = new CV();
        cv.setUser(user);
        cv.setType(type);
        cv.setOriginalFileName(name.trim());

        if (type == CVType.LINK) {
            if (externalUrl == null || externalUrl.trim().isEmpty()) {
                throw new IllegalArgumentException(messageSource.getMessage("error.cv.urlRequired", null, LocaleContextHolder.getLocale()));
            }
            String trimmedUrl = externalUrl.trim();
            if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
                throw new IllegalArgumentException(messageSource.getMessage("error.cv.urlInvalid", null, LocaleContextHolder.getLocale()));
            }
            cv.setExternalUrl(trimmedUrl);
        }

        return cvRepository.save(cv);
    }

    @Transactional(readOnly = true)
    public List<CV> findAllByUserId(UUID userId) {
        return cvRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public CV findById(Long id, UUID userId) {
        return cvRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.cv.notFound", new Object[]{id}, LocaleContextHolder.getLocale())));
    }

    @Transactional(readOnly = true)
    public Resource downloadCV(Long id, UUID userId) throws MalformedURLException {
        CV cv = findById(id, userId);
        Path filePath = Paths.get(cv.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            throw new EntityNotFoundException(messageSource.getMessage("error.cv.fileNotFound", null, LocaleContextHolder.getLocale()));
        }
        return resource;
    }

    @Transactional
    public Application assignCVToApplication(Long applicationId, Long cvId, UUID userId) {
        Application application = getApplicationByIdAndUserId(applicationId, userId);
        CV cv = findById(cvId, userId);
        application.setCv(cv);
        return applicationRepository.save(application);
    }

    @Transactional
    public Application removeCVFromApplication(Long applicationId, UUID userId) {
        Application application = getApplicationByIdAndUserId(applicationId, userId);
        application.setCv(null);
        return applicationRepository.save(application);
    }

    @Transactional
    public void deleteCV(Long id, UUID userId) {
        CV cv = findById(id, userId);
        applicationRepository.clearCVReferences(id);

        if (cv.getType() == CVType.FILE && cv.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(cv.getFilePath()));
            } catch (IOException e) {
                log.warn("Could not delete file for CV id={}, path={}", id, cv.getFilePath(), e);
            }
        }

        cvRepository.delete(cv);
    }

    @Transactional
    public CV updateCV(Long id, String name, String externalUrl, UUID userId) {
        CV cv = findById(id, userId);

        if (name != null && !name.trim().isEmpty()) {
            cv.setOriginalFileName(name.trim());
        }
        if (cv.getType() == CVType.LINK && externalUrl != null) {
            String trimmedUrl = externalUrl.trim();
            if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
                throw new IllegalArgumentException(messageSource.getMessage("error.cv.urlInvalid", null, LocaleContextHolder.getLocale()));
            }
            cv.setExternalUrl(trimmedUrl);
        }

        return cvRepository.save(cv);
    }

    private Application getApplicationByIdAndUserId(Long applicationId, UUID userId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new EntityNotFoundException(messageSource.getMessage("error.application.notFound", new Object[]{applicationId}, LocaleContextHolder.getLocale())));
    }
}
