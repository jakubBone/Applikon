package com.easyapply.service;

import com.easyapply.dto.ApplicationRequest;
import com.easyapply.dto.ApplicationResponse;
import com.easyapply.dto.StageUpdateRequest;
import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.StageHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApplicationService Unit Tests")
class ApplicationServiceTest {

    private static final String TEST_SESSION_ID = "test-session-123";

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private NoteService noteService;

    @Mock
    private StageHistoryRepository stageHistoryRepository;

    @InjectMocks
    private ApplicationService applicationService;

    @Captor
    private ArgumentCaptor<Application> applicationCaptor;

    @Captor
    private ArgumentCaptor<StageHistory> stageHistoryCaptor;

    private Application createTestApplication(Long id, String company, String position) {
        Application app = new Application();
        app.setId(id);
        app.setCompany(company);
        app.setPosition(position);
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(ApplicationStatus.WYSLANE);
        app.setAppliedAt(LocalDateTime.now());
        return app;
    }

    // ==================== CREATE Tests ====================

    @Nested
    @DisplayName("create()")
    class CreateTests {

        @Test
        @DisplayName("tworzy aplikację z domyślnym statusem WYSLANE")
        void create_SetsDefaultStatusToWyslane() {
            ApplicationRequest request = new ApplicationRequest();
            request.setCompany("Google");
            request.setPosition("Developer");
            request.setSalaryMin(10000);
            request.setCurrency("PLN");

            Application savedApp = createTestApplication(1L, "Google", "Developer");
            when(applicationRepository.save(any(Application.class))).thenReturn(savedApp);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(savedApp));

            ApplicationResponse response = applicationService.create(request, TEST_SESSION_ID);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals(ApplicationStatus.WYSLANE, captured.getStatus());
            assertEquals("Google", captured.getCompany());
            assertEquals("Developer", captured.getPosition());
        }

        @Test
        @DisplayName("tworzy początkowy wpis w historii etapów")
        void create_CreatesInitialStageHistory() {
            ApplicationRequest request = new ApplicationRequest();
            request.setCompany("Google");
            request.setPosition("Developer");
            request.setSalaryMin(10000);
            request.setCurrency("PLN");

            Application savedApp = createTestApplication(1L, "Google", "Developer");
            when(applicationRepository.save(any(Application.class))).thenReturn(savedApp);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(savedApp));

            applicationService.create(request, TEST_SESSION_ID);

            verify(stageHistoryRepository).save(stageHistoryCaptor.capture());
            StageHistory captured = stageHistoryCaptor.getValue();

            assertEquals("Wysłane", captured.getStageName());
            assertFalse(captured.isCompleted());
        }

        @Test
        @DisplayName("ustawia wszystkie pola z requestu")
        void create_SetsAllFieldsFromRequest() {
            ApplicationRequest request = new ApplicationRequest();
            request.setCompany("Google");
            request.setPosition("Senior Dev");
            request.setLink("https://careers.google.com");
            request.setSalaryMin(15000);
            request.setSalaryMax(25000);
            request.setCurrency("EUR");
            request.setSalaryType(SalaryType.NETTO);
            request.setContractType(ContractType.B2B);
            request.setSource("LinkedIn");
            request.setJobDescription("Java + Spring");

            Application savedApp = createTestApplication(1L, "Google", "Senior Dev");
            when(applicationRepository.save(any(Application.class))).thenReturn(savedApp);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(savedApp));

            applicationService.create(request, TEST_SESSION_ID);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals("Google", captured.getCompany());
            assertEquals("Senior Dev", captured.getPosition());
            assertEquals("https://careers.google.com", captured.getLink());
            assertEquals(15000, captured.getSalaryMin());
            assertEquals(25000, captured.getSalaryMax());
            assertEquals("EUR", captured.getCurrency());
            assertEquals(SalaryType.NETTO, captured.getSalaryType());
            assertEquals(ContractType.B2B, captured.getContractType());
            assertEquals("LinkedIn", captured.getSource());
            assertEquals("Java + Spring", captured.getJobDescription());
        }
    }

    // ==================== FIND Tests ====================

    @Nested
    @DisplayName("findById()")
    class FindByIdTests {

        @Test
        @DisplayName("zwraca aplikację gdy istnieje")
        void findById_ExistingId_ReturnsApplication() {
            Application app = createTestApplication(1L, "Google", "Developer");
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

            ApplicationResponse response = applicationService.findById(1L);

            assertEquals("Google", response.getCompany());
            assertEquals("Developer", response.getPosition());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void findById_NonExistingId_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            EntityNotFoundException exception = assertThrows(
                    EntityNotFoundException.class,
                    () -> applicationService.findById(999L)
            );

            assertTrue(exception.getMessage().contains("999"));
        }
    }

    @Nested
    @DisplayName("findAll()")
    class FindAllTests {

        @Test
        @DisplayName("zwraca wszystkie aplikacje")
        void findAll_ReturnsAllApplications() {
            List<Application> apps = Arrays.asList(
                    createTestApplication(1L, "Google", "Dev"),
                    createTestApplication(2L, "Meta", "Engineer")
            );
            when(applicationRepository.findBySessionId(TEST_SESSION_ID)).thenReturn(apps);

            List<ApplicationResponse> result = applicationService.findAllBySessionId(TEST_SESSION_ID);

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("zwraca pustą listę gdy brak aplikacji")
        void findAll_NoApplications_ReturnsEmptyList() {
            when(applicationRepository.findBySessionId(TEST_SESSION_ID)).thenReturn(List.of());

            List<ApplicationResponse> result = applicationService.findAllBySessionId(TEST_SESSION_ID);

            assertTrue(result.isEmpty());
        }
    }

    // ==================== UPDATE STAGE Tests ====================

    @Nested
    @DisplayName("updateStage()")
    class UpdateStageTests {

        @Test
        @DisplayName("zmiana na W_PROCESIE ustawia etap")
        void updateStage_ToInProcess_SetsStage() {
            Application app = createTestApplication(1L, "Google", "Dev");
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            StageUpdateRequest request = new StageUpdateRequest();
            request.setStatus(ApplicationStatus.W_PROCESIE);
            request.setCurrentStage("Rozmowa z HR");

            applicationService.updateStage(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals(ApplicationStatus.W_PROCESIE, captured.getStatus());
            assertEquals("Rozmowa z HR", captured.getCurrentStage());
        }

        @Test
        @DisplayName("zmiana na ODMOWA ustawia powód odrzucenia")
        void updateStage_ToRejection_SetsReason() {
            Application app = createTestApplication(1L, "Google", "Dev");
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            StageUpdateRequest request = new StageUpdateRequest();
            request.setStatus(ApplicationStatus.ODMOWA);
            request.setRejectionReason(RejectionReason.BRAK_ODPOWIEDZI);
            request.setRejectionDetails("Brak kontaktu od 2 tygodni");

            applicationService.updateStage(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals(ApplicationStatus.ODMOWA, captured.getStatus());
            assertEquals(RejectionReason.BRAK_ODPOWIEDZI, captured.getRejectionReason());
            assertEquals("Brak kontaktu od 2 tygodni", captured.getRejectionDetails());
            assertNull(captured.getCurrentStage());
        }

        @Test
        @DisplayName("zmiana na OFERTA czyści dane etapu i odrzucenia")
        void updateStage_ToOffer_ClearsStageAndRejection() {
            Application app = createTestApplication(1L, "Google", "Dev");
            app.setStatus(ApplicationStatus.W_PROCESIE);
            app.setCurrentStage("Rozmowa techniczna");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            StageUpdateRequest request = new StageUpdateRequest();
            request.setStatus(ApplicationStatus.OFERTA);

            applicationService.updateStage(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals(ApplicationStatus.OFERTA, captured.getStatus());
            assertNull(captured.getCurrentStage());
            assertNull(captured.getRejectionReason());
        }

        @Test
        @DisplayName("cofnięcie do WYSLANE resetuje wszystkie dane")
        void updateStage_BackToWyslane_ResetsAll() {
            Application app = createTestApplication(1L, "Google", "Dev");
            app.setStatus(ApplicationStatus.ODMOWA);
            app.setCurrentStage("Rozmowa techniczna");
            app.setRejectionReason(RejectionReason.ODMOWA_MAILOWA);
            app.setRejectionDetails("Za mało doświadczenia");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            StageUpdateRequest request = new StageUpdateRequest();
            request.setStatus(ApplicationStatus.WYSLANE);

            applicationService.updateStage(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            verify(stageHistoryRepository).deleteByApplicationId(1L);

            Application captured = applicationCaptor.getValue();
            assertEquals(ApplicationStatus.WYSLANE, captured.getStatus());
            assertNull(captured.getCurrentStage());
            assertNull(captured.getRejectionReason());
            assertNull(captured.getRejectionDetails());
        }

        @Test
        @DisplayName("cofnięcie z ODMOWA do W_PROCESIE czyści dane odrzucenia")
        void updateStage_FromRejectionToInProcess_ClearsRejectionData() {
            Application app = createTestApplication(1L, "Google", "Dev");
            app.setStatus(ApplicationStatus.ODMOWA);
            app.setRejectionReason(RejectionReason.ODMOWA_MAILOWA);

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);

            StageUpdateRequest request = new StageUpdateRequest();
            request.setStatus(ApplicationStatus.W_PROCESIE);
            request.setCurrentStage("Nowa rozmowa");

            applicationService.updateStage(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals(ApplicationStatus.W_PROCESIE, captured.getStatus());
            assertEquals("Nowa rozmowa", captured.getCurrentStage());
            assertNull(captured.getRejectionReason());
        }
    }

    // ==================== DELETE Tests ====================

    @Nested
    @DisplayName("delete()")
    class DeleteTests {

        @Test
        @DisplayName("usuwa aplikację i powiązane notatki")
        void delete_ExistingId_DeletesApplicationAndNotes() {
            when(applicationRepository.existsById(1L)).thenReturn(true);

            applicationService.delete(1L);

            verify(noteService).deleteByApplicationId(1L);
            verify(applicationRepository).deleteById(1L);
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void delete_NonExistingId_ThrowsException() {
            when(applicationRepository.existsById(999L)).thenReturn(false);

            assertThrows(
                    EntityNotFoundException.class,
                    () -> applicationService.delete(999L)
            );

            verify(applicationRepository, never()).deleteById(any());
        }
    }

    // ==================== DUPLICATES Tests ====================

    @Nested
    @DisplayName("findDuplicates()")
    class FindDuplicatesTests {

        @Test
        @DisplayName("znajduje duplikaty ignorując wielkość liter")
        void findDuplicates_IgnoresCase() {
            Application app = createTestApplication(1L, "Google", "Developer");
            when(applicationRepository.findBySessionIdAndCompanyIgnoreCaseAndPositionIgnoreCase(TEST_SESSION_ID, "GOOGLE", "developer"))
                    .thenReturn(List.of(app));

            List<ApplicationResponse> result = applicationService.findDuplicates(TEST_SESSION_ID, "GOOGLE", "developer");

            assertEquals(1, result.size());
            assertEquals("Google", result.get(0).getCompany());
        }

        @Test
        @DisplayName("zwraca pustą listę gdy brak duplikatów")
        void findDuplicates_NoDuplicates_ReturnsEmptyList() {
            when(applicationRepository.findBySessionIdAndCompanyIgnoreCaseAndPositionIgnoreCase(eq(TEST_SESSION_ID), any(), any()))
                    .thenReturn(List.of());

            List<ApplicationResponse> result = applicationService.findDuplicates(TEST_SESSION_ID, "NewCompany", "NewPosition");

            assertTrue(result.isEmpty());
        }
    }

    // ==================== UPDATE Tests ====================

    @Nested
    @DisplayName("update()")
    class UpdateTests {

        @Test
        @DisplayName("aktualizuje wszystkie pola aplikacji")
        void update_UpdatesAllFields() {
            Application existingApp = createTestApplication(1L, "Old Company", "Old Position");
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(existingApp));
            when(applicationRepository.save(any())).thenReturn(existingApp);

            ApplicationRequest request = new ApplicationRequest();
            request.setCompany("New Company");
            request.setPosition("New Position");
            request.setSalaryMin(20000);
            request.setSalaryMax(30000);
            request.setCurrency("EUR");

            applicationService.update(1L, request);

            verify(applicationRepository).save(applicationCaptor.capture());
            Application captured = applicationCaptor.getValue();

            assertEquals("New Company", captured.getCompany());
            assertEquals("New Position", captured.getPosition());
            assertEquals(20000, captured.getSalaryMin());
            assertEquals(30000, captured.getSalaryMax());
            assertEquals("EUR", captured.getCurrency());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void update_NonExistingId_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            ApplicationRequest request = new ApplicationRequest();
            request.setCompany("Test");

            assertThrows(
                    EntityNotFoundException.class,
                    () -> applicationService.update(999L, request)
            );
        }
    }

    // ==================== ADD STAGE Tests ====================

    @Nested
    @DisplayName("addStage()")
    class AddStageTests {

        @Test
        @DisplayName("dodaje nowy etap i zmienia status na W_PROCESIE")
        void addStage_CreatesNewStageAndChangesStatus() {
            Application app = createTestApplication(1L, "Google", "Dev");
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any())).thenReturn(app);
            // Note: stageHistoryRepository.findByApplicationIdOrderByCreatedAtAsc is only called
            // if currentStage is not null (to mark previous stage as completed)

            applicationService.addStage(1L, "Rozmowa techniczna");

            verify(applicationRepository).save(applicationCaptor.capture());
            verify(stageHistoryRepository).save(stageHistoryCaptor.capture());

            Application capturedApp = applicationCaptor.getValue();
            assertEquals(ApplicationStatus.W_PROCESIE, capturedApp.getStatus());
            assertEquals("Rozmowa techniczna", capturedApp.getCurrentStage());

            StageHistory capturedStage = stageHistoryCaptor.getValue();
            assertEquals("Rozmowa techniczna", capturedStage.getStageName());
        }
    }
}
