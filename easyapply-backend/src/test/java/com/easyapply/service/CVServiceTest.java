package com.easyapply.service;

import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.CV;
import com.easyapply.entity.CVType;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.CVRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CVService Unit Tests")
class CVServiceTest {

    private static final String TEST_SESSION_ID = "test-session-123";

    @Mock
    private CVRepository cvRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    private CVService cvService;

    @TempDir
    Path tempDir;

    @Captor
    private ArgumentCaptor<CV> cvCaptor;

    @BeforeEach
    void setUp() {
        cvService = new CVService(cvRepository, applicationRepository, tempDir.toString());
    }

    private CV createTestCV(Long id, String name, CVType type) {
        CV cv = new CV();
        cv.setId(id);
        cv.setOriginalFileName(name);
        cv.setType(type);
        cv.setUploadedAt(LocalDateTime.now());
        if (type == CVType.FILE) {
            cv.setFileName("uuid_" + name);
            cv.setFilePath(tempDir.resolve("uuid_" + name).toString());
            cv.setFileSize(1024L);
        }
        if (type == CVType.LINK) {
            cv.setExternalUrl("https://example.com/" + name);
        }
        return cv;
    }

    private Application createTestApplication(Long id) {
        Application app = new Application();
        app.setId(id);
        app.setCompany("Google");
        app.setPosition("Developer");
        app.setStatus(ApplicationStatus.WYSLANE);
        return app;
    }

    // ==================== UPLOAD Tests ====================

    @Nested
    @DisplayName("uploadCV()")
    class UploadCVTests {

        @Test
        @DisplayName("uploaduje poprawny plik PDF")
        void uploadCV_ValidPDF_Success() throws IOException {
            byte[] content = "%PDF-1.4\nTest content".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "test.pdf",
                    "application/pdf",
                    content
            );

            CV savedCV = createTestCV(1L, "test.pdf", CVType.FILE);
            when(cvRepository.save(any(CV.class))).thenReturn(savedCV);

            CV result = cvService.uploadCV(file, TEST_SESSION_ID);

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertEquals(CVType.FILE, captured.getType());
            assertEquals("test.pdf", captured.getOriginalFileName());
            assertEquals(content.length, captured.getFileSize());
            assertNotNull(captured.getFileName());
            assertTrue(captured.getFileName().contains("test.pdf"));
        }

        @Test
        @DisplayName("odrzuca pusty plik")
        void uploadCV_EmptyFile_ThrowsException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "empty.pdf",
                    "application/pdf",
                    new byte[0]
            );

            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.uploadCV(file, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("pusty"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("odrzuca plik nie-PDF")
        void uploadCV_NonPDF_ThrowsException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "document.txt",
                    "text/plain",
                    "Not a PDF".getBytes()
            );

            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.uploadCV(file, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("PDF"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("odrzuca plik większy niż 5MB")
        void uploadCV_TooLarge_ThrowsException() {
            byte[] largeContent = new byte[6 * 1024 * 1024]; // 6MB
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "large.pdf",
                    "application/pdf",
                    largeContent
            );

            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.uploadCV(file, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("5MB"));
            verify(cvRepository, never()).save(any());
        }
    }

    // ==================== CREATE CV Tests ====================

    @Nested
    @DisplayName("createCV()")
    class CreateCVTests {

        @Test
        @DisplayName("tworzy CV typu LINK z URL")
        void createCV_TypeLink_WithUrl_Success() {
            CV savedCV = createTestCV(1L, "CV.pdf", CVType.LINK);
            when(cvRepository.save(any(CV.class))).thenReturn(savedCV);

            CV result = cvService.createCV("CV.pdf", CVType.LINK, "https://drive.google.com/123", TEST_SESSION_ID);

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertEquals(CVType.LINK, captured.getType());
            assertEquals("CV.pdf", captured.getOriginalFileName());
            assertEquals("https://drive.google.com/123", captured.getExternalUrl());
        }

        @Test
        @DisplayName("tworzy CV typu NOTE bez URL")
        void createCV_TypeNote_WithoutUrl_Success() {
            CV savedCV = createTestCV(1L, "CV.pdf", CVType.NOTE);
            when(cvRepository.save(any(CV.class))).thenReturn(savedCV);

            CV result = cvService.createCV("CV.pdf", CVType.NOTE, null, TEST_SESSION_ID);

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertEquals(CVType.NOTE, captured.getType());
            assertEquals("CV.pdf", captured.getOriginalFileName());
            assertNull(captured.getExternalUrl());
        }

        @Test
        @DisplayName("odrzuca pustą nazwę")
        void createCV_EmptyName_ThrowsException() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.createCV("", CVType.NOTE, null, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("pusta"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("odrzuca null nazwę")
        void createCV_NullName_ThrowsException() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.createCV(null, CVType.NOTE, null, TEST_SESSION_ID)
            );

            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("odrzuca typ FILE (wymaga uploadu)")
        void createCV_TypeFile_ThrowsException() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.createCV("CV.pdf", CVType.FILE, null, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("uploadCV"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("wymaga URL dla typu LINK")
        void createCV_TypeLinkWithoutUrl_ThrowsException() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.createCV("CV.pdf", CVType.LINK, null, TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("URL"));
            verify(cvRepository, never()).save(any());
        }

        @Test
        @DisplayName("wymaga URL dla typu LINK - pusty string")
        void createCV_TypeLinkWithEmptyUrl_ThrowsException() {
            IllegalArgumentException exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> cvService.createCV("CV.pdf", CVType.LINK, "   ", TEST_SESSION_ID)
            );

            assertTrue(exception.getMessage().contains("URL"));
            verify(cvRepository, never()).save(any());
        }
    }

    // ==================== FIND Tests ====================

    @Nested
    @DisplayName("findAll()")
    class FindAllTests {

        @Test
        @DisplayName("zwraca wszystkie CV")
        void findAll_ReturnsAllCVs() {
            List<CV> cvs = Arrays.asList(
                    createTestCV(1L, "CV1.pdf", CVType.FILE),
                    createTestCV(2L, "CV2.pdf", CVType.LINK),
                    createTestCV(3L, "CV3.pdf", CVType.NOTE)
            );
            when(cvRepository.findBySessionId(TEST_SESSION_ID)).thenReturn(cvs);

            List<CV> result = cvService.findAllBySessionId(TEST_SESSION_ID);

            assertEquals(3, result.size());
        }

        @Test
        @DisplayName("zwraca pustą listę gdy brak CV")
        void findAll_NoCVs_ReturnsEmptyList() {
            when(cvRepository.findBySessionId(TEST_SESSION_ID)).thenReturn(List.of());

            List<CV> result = cvService.findAllBySessionId(TEST_SESSION_ID);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("findById()")
    class FindByIdTests {

        @Test
        @DisplayName("zwraca CV gdy istnieje")
        void findById_ExistingId_ReturnsCV() {
            CV cv = createTestCV(1L, "CV.pdf", CVType.FILE);
            when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

            CV result = cvService.findById(1L);

            assertEquals("CV.pdf", result.getOriginalFileName());
            assertEquals(CVType.FILE, result.getType());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy CV nie istnieje")
        void findById_NonExistingId_ThrowsException() {
            when(cvRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.findById(999L)
            );
        }
    }

    // ==================== ASSIGN CV Tests ====================

    @Nested
    @DisplayName("assignCVToApplication()")
    class AssignCVToApplicationTests {

        @Test
        @DisplayName("przypisuje CV do aplikacji")
        void assignCV_Success() {
            Application app = createTestApplication(1L);
            CV cv = createTestCV(10L, "CV.pdf", CVType.FILE);

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(cvRepository.findById(10L)).thenReturn(Optional.of(cv));
            when(applicationRepository.save(any())).thenReturn(app);

            Application result = cvService.assignCVToApplication(1L, 10L);

            verify(applicationRepository).save(argThat(a -> a.getCv() == cv));
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void assignCV_ApplicationNotFound_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.assignCVToApplication(999L, 1L)
            );
        }

        @Test
        @DisplayName("rzuca wyjątek gdy CV nie istnieje")
        void assignCV_CVNotFound_ThrowsException() {
            Application app = createTestApplication(1L);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(cvRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.assignCVToApplication(1L, 999L)
            );
        }
    }

    @Nested
    @DisplayName("removeCVFromApplication()")
    class RemoveCVFromApplicationTests {

        @Test
        @DisplayName("usuwa CV z aplikacji")
        void removeCV_Success() {
            CV cv = createTestCV(10L, "CV.pdf", CVType.FILE);
            Application app = createTestApplication(1L);
            app.setCv(cv);

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            cvService.removeCVFromApplication(1L);

            verify(applicationRepository).save(argThat(a -> a.getCv() == null));
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void removeCV_ApplicationNotFound_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.removeCVFromApplication(999L)
            );
        }
    }

    // ==================== UPDATE Tests ====================

    @Nested
    @DisplayName("updateCV()")
    class UpdateCVTests {

        @Test
        @DisplayName("aktualizuje nazwę CV")
        void updateCV_UpdatesName() {
            CV existingCV = createTestCV(1L, "OldName.pdf", CVType.NOTE);
            when(cvRepository.findById(1L)).thenReturn(Optional.of(existingCV));
            when(cvRepository.save(any())).thenReturn(existingCV);

            cvService.updateCV(1L, "NewName.pdf", null);

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertEquals("NewName.pdf", captured.getOriginalFileName());
        }

        @Test
        @DisplayName("aktualizuje URL dla typu LINK")
        void updateCV_UpdatesUrlForLink() {
            CV existingCV = createTestCV(1L, "CV.pdf", CVType.LINK);
            when(cvRepository.findById(1L)).thenReturn(Optional.of(existingCV));
            when(cvRepository.save(any())).thenReturn(existingCV);

            cvService.updateCV(1L, null, "https://new.url");

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertEquals("https://new.url", captured.getExternalUrl());
        }

        @Test
        @DisplayName("ignoruje URL dla typu NOTE")
        void updateCV_IgnoresUrlForNote() {
            CV existingCV = createTestCV(1L, "CV.pdf", CVType.NOTE);
            when(cvRepository.findById(1L)).thenReturn(Optional.of(existingCV));
            when(cvRepository.save(any())).thenReturn(existingCV);

            cvService.updateCV(1L, null, "https://should.be.ignored");

            verify(cvRepository).save(cvCaptor.capture());
            CV captured = cvCaptor.getValue();

            assertNull(captured.getExternalUrl());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy CV nie istnieje")
        void updateCV_NonExistingId_ThrowsException() {
            when(cvRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.updateCV(999L, "New.pdf", null)
            );
        }
    }

    // ==================== DELETE Tests ====================

    @Nested
    @DisplayName("deleteCV()")
    class DeleteCVTests {

        @Test
        @DisplayName("usuwa CV i czyści referencje")
        void deleteCV_RemovesCVAndClearsReferences() {
            CV cv = createTestCV(1L, "CV.pdf", CVType.NOTE);
            when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

            cvService.deleteCV(1L);

            verify(applicationRepository).clearCVReferences(1L);
            verify(cvRepository).delete(cv);
        }

        @Test
        @DisplayName("usuwa plik z dysku dla typu FILE")
        void deleteCV_TypeFile_DeletesFileFromDisk() throws IOException {
            // Create actual file
            Path filePath = tempDir.resolve("uuid_test.pdf");
            java.nio.file.Files.write(filePath, "test".getBytes());
            assertTrue(java.nio.file.Files.exists(filePath));

            CV cv = new CV();
            cv.setId(1L);
            cv.setType(CVType.FILE);
            cv.setFilePath(filePath.toString());
            cv.setOriginalFileName("test.pdf");

            when(cvRepository.findById(1L)).thenReturn(Optional.of(cv));

            cvService.deleteCV(1L);

            assertFalse(java.nio.file.Files.exists(filePath));
            verify(cvRepository).delete(cv);
        }

        @Test
        @DisplayName("rzuca wyjątek gdy CV nie istnieje")
        void deleteCV_NonExistingId_ThrowsException() {
            when(cvRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> cvService.deleteCV(999L)
            );

            verify(cvRepository, never()).delete(any());
        }
    }
}
