package com.easyapply.service;

import com.easyapply.entity.Application;
import com.easyapply.entity.CV;
import com.easyapply.entity.CVType;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.CVRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
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

    private final CVRepository cvRepository;
    private final ApplicationRepository applicationRepository;
    private final Path uploadDir;

    public CVService(CVRepository cvRepository, ApplicationRepository applicationRepository,
                     @Value("${app.upload.dir:uploads/cv}") String uploadDir) {
        this.cvRepository = cvRepository;
        this.applicationRepository = applicationRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Nie można utworzyć katalogu uploads", e);
        }
    }

    @Transactional
    public CV uploadCV(MultipartFile file, String sessionId) throws IOException {
        // Walidacja
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Plik nie może być pusty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Dozwolone są tylko pliki PDF");
        }

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            throw new IllegalArgumentException("Plik nie może przekraczać 5MB");
        }

        // Generuj unikalną nazwę pliku
        String originalFileName = file.getOriginalFilename();
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path filePath = uploadDir.resolve(fileName);

        // Zapisz plik
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Zapisz w bazie
        CV cv = new CV();
        cv.setSessionId(sessionId);
        cv.setType(CVType.FILE);
        cv.setFileName(fileName);
        cv.setOriginalFileName(originalFileName);
        cv.setFilePath(filePath.toString());
        cv.setFileSize(file.getSize());

        return cvRepository.save(cv);
    }

    @Transactional
    public CV createCV(String name, CVType type, String externalUrl, String sessionId) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Nazwa CV nie może być pusta");
        }

        if (type == CVType.FILE) {
            throw new IllegalArgumentException("Użyj metody uploadCV dla plików");
        }

        CV cv = new CV();
        cv.setSessionId(sessionId);
        cv.setType(type);
        cv.setOriginalFileName(name.trim());

        if (type == CVType.LINK) {
            if (externalUrl == null || externalUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("URL jest wymagany dla typu LINK");
            }
            cv.setExternalUrl(externalUrl.trim());
        }

        return cvRepository.save(cv);
    }

    public List<CV> findAllBySessionId(String sessionId) {
        return cvRepository.findBySessionId(sessionId);
    }

    public CV findById(Long id) {
        return cvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("CV o ID " + id + " nie zostało znalezione"));
    }

    public Resource downloadCV(Long id) throws MalformedURLException {
        CV cv = findById(id);
        Path filePath = Paths.get(cv.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new EntityNotFoundException("Plik CV nie istnieje na dysku");
        }

        return resource;
    }

    @Transactional
    public Application assignCVToApplication(Long applicationId, Long cvId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + applicationId + " nie została znaleziona"));

        CV cv = findById(cvId);
        application.setCv(cv);

        return applicationRepository.save(application);
    }

    @Transactional
    public Application removeCVFromApplication(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Aplikacja o ID " + applicationId + " nie została znaleziona"));

        application.setCv(null);
        return applicationRepository.save(application);
    }

    @Transactional
    public void deleteCV(Long id) {
        CV cv = findById(id);

        // Najpierw usuń referencje do tego CV ze wszystkich aplikacji (bezpośrednie zapytanie SQL)
        applicationRepository.clearCVReferences(id);

        // Usuń plik z dysku tylko dla typu FILE
        if (cv.getType() == CVType.FILE && cv.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(cv.getFilePath()));
            } catch (IOException e) {
                // Log error but continue
            }
        }

        cvRepository.delete(cv);
    }

    @Transactional
    public CV updateCV(Long id, String name, String externalUrl) {
        CV cv = findById(id);

        if (name != null && !name.trim().isEmpty()) {
            cv.setOriginalFileName(name.trim());
        }

        if (cv.getType() == CVType.LINK && externalUrl != null) {
            cv.setExternalUrl(externalUrl.trim());
        }

        return cvRepository.save(cv);
    }
}
