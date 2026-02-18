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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("NoteService tests")
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
        setField(testApplication, "id", 1L);
        testApplication.setCompany("Google");
        testApplication.setPosition("Developer");
        testApplication.setStatus(ApplicationStatus.WYSLANE);
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private Note note(long id, String content, NoteCategory category) {
        Note note = new Note();
        note.setId(id);
        note.setContent(content);
        note.setCategory(category);
        note.setApplication(testApplication);
        note.setCreatedAt(LocalDateTime.now());
        return note;
    }

    @Nested
    class CreateTests {

        @Test
        void create_withCategory_returnsMappedResponse() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            when(noteRepository.save(any(Note.class))).thenReturn(note(11L, "Test content", NoteCategory.PYTANIA));

            NoteResponse response = noteService.create(1L, new NoteRequest("Test content", NoteCategory.PYTANIA));

            verify(noteRepository).save(noteCaptor.capture());
            Note captured = noteCaptor.getValue();
            assertEquals("Test content", captured.getContent());
            assertEquals(NoteCategory.PYTANIA, captured.getCategory());

            assertEquals("Test content", response.content());
            assertEquals(NoteCategory.PYTANIA, response.category());
            assertEquals(1L, response.applicationId());
        }

        @Test
        void create_withoutCategory_defaultsToInne() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            when(noteRepository.save(any(Note.class))).thenReturn(note(12L, "No category", NoteCategory.INNE));

            NoteResponse response = noteService.create(1L, new NoteRequest("No category", null));

            assertEquals(NoteCategory.INNE, response.category());
        }

        @Test
        void create_whenApplicationMissing_throws() {
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(
                    EntityNotFoundException.class,
                    () -> noteService.create(999L, new NoteRequest("test", NoteCategory.INNE))
            );
            verify(noteRepository, never()).save(any(Note.class));
        }
    }

    @Nested
    class FindTests {

        @Test
        void findByApplicationId_returnsSortedList() {
            when(applicationRepository.existsById(1L)).thenReturn(true);
            when(noteRepository.findByApplicationIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                    note(2L, "Newest", NoteCategory.FEEDBACK),
                    note(1L, "Older", NoteCategory.INNE)
            ));

            List<NoteResponse> result = noteService.findByApplicationId(1L);

            assertEquals(2, result.size());
            assertEquals("Newest", result.get(0).content());
            assertEquals("Older", result.get(1).content());
        }

        @Test
        void findById_returnsMappedNote() {
            when(noteRepository.findById(1L)).thenReturn(Optional.of(note(1L, "Content", NoteCategory.PYTANIA)));

            NoteResponse response = noteService.findById(1L);

            assertEquals("Content", response.content());
            assertEquals(NoteCategory.PYTANIA, response.category());
        }
    }

    @Nested
    class UpdateAndDeleteTests {

        @Test
        void update_withNullCategory_keepsOldCategory() {
            Note existing = note(1L, "Old", NoteCategory.FEEDBACK);
            when(noteRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

            NoteResponse response = noteService.update(1L, new NoteRequest("Updated", null));

            assertEquals("Updated", response.content());
            assertEquals(NoteCategory.FEEDBACK, response.category());
        }

        @Test
        void delete_missingNote_throws() {
            when(noteRepository.existsById(10L)).thenReturn(false);

            assertThrows(EntityNotFoundException.class, () -> noteService.delete(10L));
        }

        @Test
        void deleteByApplicationId_delegatesToRepository() {
            noteService.deleteByApplicationId(1L);
            verify(noteRepository).deleteByApplicationId(1L);
        }
    }

    @Nested
    class SalaryNoteTests {

        @Test
        void createSalaryChangeNote_buildsExpectedText() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            when(noteRepository.save(any(Note.class))).thenReturn(note(
                    101L,
                    "Stawka zmieniona: 5000 PLN -> 7000 PLN",
                    NoteCategory.INNE
            ));

            NoteResponse response = noteService.createSalaryChangeNote(1L, 5000, "PLN", 7000, "PLN");

            verify(noteRepository).save(noteCaptor.capture());
            assertTrue(noteCaptor.getValue().getContent().contains("5000"));
            assertTrue(noteCaptor.getValue().getContent().contains("7000"));
            assertEquals(101L, response.id());
        }

        @Test
        void createSalaryChangeNote_handlesNulls() {
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(testApplication));
            when(noteRepository.save(any(Note.class))).thenReturn(note(102L, "any", NoteCategory.INNE));

            NoteResponse response = noteService.createSalaryChangeNote(1L, null, null, 7000, "EUR");

            assertNotNull(response);
        }
    }
}
