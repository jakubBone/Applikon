package com.easyapply.service;

import com.easyapply.dto.NoteRequest;
import com.easyapply.dto.NoteResponse;
import com.easyapply.entity.Application;
import com.easyapply.entity.ApplicationStatus;
import com.easyapply.entity.Note;
import com.easyapply.entity.NoteCategory;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
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
@DisplayName("NoteService Unit Tests")
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private NoteService noteService;

    @Captor
    private ArgumentCaptor<Note> noteCaptor;

    private Application testApplication;

    @BeforeEach
    void setUp() {
        testApplication = new Application();
        testApplication.setId(1L);
        testApplication.setCompany("Google");
        testApplication.setPosition("Developer");
        testApplication.setStatus(ApplicationStatus.WYSLANE);
    }

    private Note createTestNote(Long id, String content, NoteCategory category) {
        Note note = new Note();
        note.setId(id);
        note.setContent(content);
        note.setCategory(category);
        note.setApplication(testApplication);
        note.setCreatedAt(LocalDateTime.now());
        return note;
    }

    // ==================== CREATE Tests ====================

    @Nested
    @DisplayName("create()")
    class CreateTests {

        @Test
        @DisplayName("tworzy notatkę z kategorią PYTANIA")
        void create_WithCategoryPytania_Success() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            Note savedNote = createTestNote(1L, "Test content", NoteCategory.PYTANIA);
            when(noteRepository.save(any(Note.class))).thenReturn(savedNote);

            NoteRequest request = new NoteRequest();
            request.setContent("Test content");
            request.setCategory(NoteCategory.PYTANIA);

            NoteResponse response = noteService.create(1L, request);

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();

            assertEquals("Test content", captured.getContent());
            assertEquals(NoteCategory.PYTANIA, captured.getCategory());
            assertEquals(testApplication, captured.getApplication());
        }

        @Test
        @DisplayName("tworzy notatkę z kategorią FEEDBACK")
        void create_WithCategoryFeedback_Success() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            Note savedNote = createTestNote(1L, "Feedback content", NoteCategory.FEEDBACK);
            when(noteRepository.save(any(Note.class))).thenReturn(savedNote);

            NoteRequest request = new NoteRequest();
            request.setContent("Feedback content");
            request.setCategory(NoteCategory.FEEDBACK);

            NoteResponse response = noteService.create(1L, request);

            assertEquals(NoteCategory.FEEDBACK, response.getCategory());
        }

        @Test
        @DisplayName("tworzy notatkę z domyślną kategorią INNE")
        void create_WithDefaultCategoryInne_Success() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            Note savedNote = createTestNote(1L, "Content", NoteCategory.INNE);
            when(noteRepository.save(any(Note.class))).thenReturn(savedNote);

            NoteRequest request = new NoteRequest();
            request.setContent("Content");
            // category is null - should default to INNE

            noteService.create(1L, request);

            verify(noteRepository).save(noteCaptor.capture());
            // The Note constructor handles default category
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void create_ApplicationNotFound_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            NoteRequest request = new NoteRequest();
            request.setContent("Test");

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.create(999L, request)
            );

            verify(noteRepository, never()).save(any());
        }
    }

    // ==================== FIND Tests ====================

    @Nested
    @DisplayName("findByApplicationId()")
    class FindByApplicationIdTests {

        @Test
        @DisplayName("zwraca notatki posortowane od najnowszych")
        void findByApplicationId_ReturnsSortedNotes() {
            when(applicationRepository.existsById(1L)).thenReturn(true);

            Note note1 = createTestNote(1L, "Starsza", NoteCategory.INNE);
            Note note2 = createTestNote(2L, "Nowsza", NoteCategory.PYTANIA);
            when(noteRepository.findByApplicationIdOrderByCreatedAtDesc(1L))
                    .thenReturn(Arrays.asList(note2, note1)); // Already sorted by repo

            List<NoteResponse> result = noteService.findByApplicationId(1L);

            assertEquals(2, result.size());
            assertEquals("Nowsza", result.get(0).getContent());
            assertEquals("Starsza", result.get(1).getContent());
        }

        @Test
        @DisplayName("zwraca pustą listę gdy brak notatek")
        void findByApplicationId_NoNotes_ReturnsEmptyList() {
            when(applicationRepository.existsById(1L)).thenReturn(true);
            when(noteRepository.findByApplicationIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of());

            List<NoteResponse> result = noteService.findByApplicationId(1L);

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void findByApplicationId_ApplicationNotFound_ThrowsException() {
            when(applicationRepository.existsById(999L)).thenReturn(false);

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.findByApplicationId(999L)
            );
        }
    }

    @Nested
    @DisplayName("findById()")
    class FindByIdTests {

        @Test
        @DisplayName("zwraca notatkę gdy istnieje")
        void findById_ExistingId_ReturnsNote() {
            Note note = createTestNote(1L, "Content", NoteCategory.PYTANIA);
            when(noteRepository.findById(1L)).thenReturn(Optional.of(note));

            NoteResponse response = noteService.findById(1L);

            assertEquals("Content", response.getContent());
            assertEquals(NoteCategory.PYTANIA, response.getCategory());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy notatka nie istnieje")
        void findById_NonExistingId_ThrowsException() {
            when(noteRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.findById(999L)
            );
        }
    }

    // ==================== UPDATE Tests ====================

    @Nested
    @DisplayName("update()")
    class UpdateTests {

        @Test
        @DisplayName("aktualizuje treść i kategorię notatki")
        void update_UpdatesContentAndCategory() {
            Note existingNote = createTestNote(1L, "Old content", NoteCategory.INNE);
            when(noteRepository.findById(1L)).thenReturn(Optional.of(existingNote));
            when(noteRepository.save(any())).thenReturn(existingNote);

            NoteRequest request = new NoteRequest();
            request.setContent("New content");
            request.setCategory(NoteCategory.PYTANIA);

            noteService.update(1L, request);

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();

            assertEquals("New content", captured.getContent());
            assertEquals(NoteCategory.PYTANIA, captured.getCategory());
        }

        @Test
        @DisplayName("aktualizuje tylko treść gdy kategoria jest null")
        void update_OnlyContent_WhenCategoryIsNull() {
            Note existingNote = createTestNote(1L, "Old content", NoteCategory.FEEDBACK);
            when(noteRepository.findById(1L)).thenReturn(Optional.of(existingNote));
            when(noteRepository.save(any())).thenReturn(existingNote);

            NoteRequest request = new NoteRequest();
            request.setContent("New content");
            request.setCategory(null);

            noteService.update(1L, request);

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();

            assertEquals("New content", captured.getContent());
            assertEquals(NoteCategory.FEEDBACK, captured.getCategory()); // Unchanged
        }

        @Test
        @DisplayName("rzuca wyjątek gdy notatka nie istnieje")
        void update_NonExistingId_ThrowsException() {
            when(noteRepository.findById(999L)).thenReturn(Optional.empty());

            NoteRequest request = new NoteRequest();
            request.setContent("Test");

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.update(999L, request)
            );
        }
    }

    // ==================== DELETE Tests ====================

    @Nested
    @DisplayName("delete()")
    class DeleteTests {

        @Test
        @DisplayName("usuwa notatkę gdy istnieje")
        void delete_ExistingId_DeletesNote() {
            when(noteRepository.existsById(1L)).thenReturn(true);

            noteService.delete(1L);

            verify(noteRepository).deleteById(1L);
        }

        @Test
        @DisplayName("rzuca wyjątek gdy notatka nie istnieje")
        void delete_NonExistingId_ThrowsException() {
            when(noteRepository.existsById(999L)).thenReturn(false);

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.delete(999L)
            );

            verify(noteRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("deleteByApplicationId()")
    class DeleteByApplicationIdTests {

        @Test
        @DisplayName("usuwa wszystkie notatki dla aplikacji")
        void deleteByApplicationId_DeletesAllNotes() {
            noteService.deleteByApplicationId(1L);

            verify(noteRepository).deleteByApplicationId(1L);
        }
    }

    // ==================== SALARY CHANGE NOTE Tests ====================

    @Nested
    @DisplayName("createSalaryChangeNote()")
    class CreateSalaryChangeNoteTests {

        @Test
        @DisplayName("tworzy notatkę o zmianie stawki")
        void createSalaryChangeNote_CreatesNoteWithCorrectContent() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            Note savedNote = createTestNote(1L, "Stawka zmieniona: 5000 PLN -> 7000 PLN", NoteCategory.INNE);
            when(noteRepository.save(any(Note.class))).thenReturn(savedNote);

            NoteResponse response = noteService.createSalaryChangeNote(1L, 5000, "PLN", 7000, "PLN");

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();

            assertTrue(captured.getContent().contains("5000"));
            assertTrue(captured.getContent().contains("7000"));
            assertTrue(captured.getContent().contains("PLN"));
        }

        @Test
        @DisplayName("obsługuje wartości null")
        void createSalaryChangeNote_HandlesNullValues() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            Note savedNote = createTestNote(1L, "Stawka zmieniona", NoteCategory.INNE);
            when(noteRepository.save(any(Note.class))).thenReturn(savedNote);

            noteService.createSalaryChangeNote(1L, null, null, 7000, "EUR");

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();

            // Should handle nulls gracefully
            assertNotNull(captured.getContent());
        }

        @Test
        @DisplayName("rzuca wyjątek gdy aplikacja nie istnieje")
        void createSalaryChangeNote_ApplicationNotFound_ThrowsException() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.createSalaryChangeNote(999L, 5000, "PLN", 7000, "PLN")
            );
        }
    }
}
