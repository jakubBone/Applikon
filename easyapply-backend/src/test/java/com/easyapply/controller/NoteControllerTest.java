package com.easyapply.controller;

import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.NoteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NoteRepository noteRepository;

    private Application testApplication;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        applicationRepository.deleteAll();
        testApplication = createTestApplication();
    }

    // ==================== ETAP 5: Notatki Tests ====================

    @Test
    @Order(1)
    @DisplayName("POST /api/applications/{id}/notes - tworzy notatke kategorii PYTANIA")
    void createNote_CategoryPytania_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("content", "Pytali o Spring Boot i Docker");
        request.put("category", "PYTANIA");

        mockMvc.perform(post("/api/applications/" + testApplication.getId() + "/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.content").value("Pytali o Spring Boot i Docker"))
                .andExpect(jsonPath("$.category").value("PYTANIA"))
                .andExpect(jsonPath("$.applicationId").value(testApplication.getId()))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/applications/{id}/notes - tworzy notatke kategorii FEEDBACK")
    void createNote_CategoryFeedback_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("content", "Pozytywny feedback od rekrutera");
        request.put("category", "FEEDBACK");

        mockMvc.perform(post("/api/applications/" + testApplication.getId() + "/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("FEEDBACK"));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/applications/{id}/notes - tworzy notatke kategorii INNE")
    void createNote_CategoryInne_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("content", "Kontakt: rekruter@example.com");
        request.put("category", "INNE");

        mockMvc.perform(post("/api/applications/" + testApplication.getId() + "/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("INNE"));
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/applications/{id}/notes - walidacja: pusta notatka zwraca 400")
    void createNote_EmptyContent_ReturnsBadRequest() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("content", "");
        request.put("category", "INNE");

        mockMvc.perform(post("/api/applications/" + testApplication.getId() + "/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("pusta")));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/applications/{id}/notes - zwraca notatki posortowane od najnowszych")
    void getNotes_ReturnsSortedByDateDesc() throws Exception {
        // Tworzymy notatki w kolejnosci
        createTestNote("Notatka 1", NoteCategory.PYTANIA);
        Thread.sleep(10); // Mala przerwa dla roznych timestampow
        createTestNote("Notatka 2", NoteCategory.FEEDBACK);
        Thread.sleep(10);
        createTestNote("Notatka 3", NoteCategory.INNE);

        mockMvc.perform(get("/api/applications/" + testApplication.getId() + "/notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                // Najnowsza pierwsza
                .andExpect(jsonPath("$[0].content").value("Notatka 3"))
                .andExpect(jsonPath("$[1].content").value("Notatka 2"))
                .andExpect(jsonPath("$[2].content").value("Notatka 1"));
    }

    @Test
    @Order(6)
    @DisplayName("PUT /api/notes/{id} - edytuje notatke")
    void updateNote_ChangesContentAndCategory() throws Exception {
        Note note = createTestNote("Stara tresc", NoteCategory.INNE);

        Map<String, Object> updateRequest = new HashMap<>();
        updateRequest.put("content", "Nowa tresc notatki");
        updateRequest.put("category", "PYTANIA");

        mockMvc.perform(put("/api/notes/" + note.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Nowa tresc notatki"))
                .andExpect(jsonPath("$.category").value("PYTANIA"));
    }

    @Test
    @Order(7)
    @DisplayName("DELETE /api/notes/{id} - usuwa notatke")
    void deleteNote_RemovesFromDatabase() throws Exception {
        Note note = createTestNote("Do usuniecia", NoteCategory.INNE);
        Long id = note.getId();

        mockMvc.perform(delete("/api/notes/" + id))
                .andExpect(status().isNoContent());

        assertFalse(noteRepository.findById(id).isPresent());
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/applications/{id}/notes - zwraca pusta liste dla aplikacji bez notatek")
    void getNotes_NoNotes_ReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/applications/" + testApplication.getId() + "/notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/applications/{id}/notes - domyslna kategoria INNE")
    void createNote_NoCategoryProvided_DefaultsToInne() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("content", "Notatka bez kategorii");
        // Brak category w request

        mockMvc.perform(post("/api/applications/" + testApplication.getId() + "/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("INNE"));
    }

    // ==================== Helper methods ====================

    private Application createTestApplication() {
        Application app = new Application();
        app.setCompany("TestCompany");
        app.setPosition("TestPosition");
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(ApplicationStatus.WYSLANE);
        app.setAppliedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    private Note createTestNote(String content, NoteCategory category) {
        Note note = new Note();
        note.setContent(content);
        note.setCategory(category);
        note.setApplication(testApplication);
        note.setCreatedAt(LocalDateTime.now());
        return noteRepository.save(note);
    }
}
