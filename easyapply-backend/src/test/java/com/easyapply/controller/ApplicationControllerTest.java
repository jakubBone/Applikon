package com.easyapply.controller;

import com.easyapply.entity.*;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.CVRepository;
import com.easyapply.repository.NoteRepository;
import com.easyapply.repository.UserRepository;
import com.easyapply.security.AuthenticatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
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
class ApplicationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private CVRepository cvRepository;
    @Autowired private NoteRepository noteRepository;
    @Autowired private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        noteRepository.deleteAll();
        applicationRepository.deleteAll();
        cvRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("test@example.com", "Test User", "google-test-app"));

        AuthenticatedUser principal = new AuthenticatedUser(
                testUser.getId(), testUser.getEmail(), testUser.getName());
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, Collections.emptyList()));
        SecurityContextHolder.setContext(ctx);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ==================== ETAP 1: CRUD Tests ====================

    @Test
    @Order(1)
    @DisplayName("POST /api/applications - tworzy aplikacje z widelkami wynagrodzen")
    void createApplication_WithSalaryRange_ReturnsCreated() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("company", "Google");
        request.put("position", "Junior Java Dev");
        request.put("salaryMin", 8000);
        request.put("salaryMax", 12000);
        request.put("currency", "PLN");
        request.put("salaryType", "BRUTTO");
        request.put("contractType", "B2B");
        request.put("link", "https://careers.google.com/123");
        request.put("source", "LinkedIn");
        request.put("jobDescription", "Java 11+, Spring Boot, Docker");

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.company").value("Google"))
                .andExpect(jsonPath("$.position").value("Junior Java Dev"))
                .andExpect(jsonPath("$.salaryMin").value(8000))
                .andExpect(jsonPath("$.salaryMax").value(12000))
                .andExpect(jsonPath("$.currency").value("PLN"))
                .andExpect(jsonPath("$.salaryType").value("BRUTTO"))
                .andExpect(jsonPath("$.contractType").value("B2B"))
                .andExpect(jsonPath("$.status").value("WYSLANE"))
                .andExpect(jsonPath("$.appliedAt").exists());
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/applications - walidacja: brak company zwraca 400")
    void createApplication_WithoutCompany_ReturnsBadRequest() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("position", "Dev");
        request.put("salaryMin", 5000);
        request.put("currency", "PLN");

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Nazwa firmy")));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/applications - walidacja: ujemna stawka zwraca 400")
    void createApplication_WithNegativeSalary_ReturnsBadRequest() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("company", "Test");
        request.put("position", "Dev");
        request.put("salaryMin", -5000);

        mockMvc.perform(post("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("dodatnia")));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/applications - zwraca liste aplikacji")
    void getAllApplications_ReturnsListOfApplications() throws Exception {
        createTestApplication("Google", "Dev");
        createTestApplication("Meta", "Engineer");

        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].company", containsInAnyOrder("Google", "Meta")));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/applications/{id} - zwraca szczegoly aplikacji")
    void getApplicationById_ReturnsApplication() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        mockMvc.perform(get("/api/applications/" + app.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("Google"))
                .andExpect(jsonPath("$.position").value("Dev"));
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/applications/{id} - nieistniejace ID zwraca 404")
    void getApplicationById_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/applications/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value(containsString("znaleziona")));
    }

    @Test
    @Order(7)
    @DisplayName("PUT /api/applications/{id} - aktualizuje aplikacje")
    void updateApplication_ReturnsUpdatedApplication() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        Map<String, Object> updateRequest = new HashMap<>();
        updateRequest.put("company", "Google Updated");
        updateRequest.put("position", "Senior Dev");
        updateRequest.put("salaryMin", 15000);
        updateRequest.put("salaryMax", 20000);
        updateRequest.put("currency", "EUR");

        mockMvc.perform(put("/api/applications/" + app.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("Google Updated"))
                .andExpect(jsonPath("$.position").value("Senior Dev"))
                .andExpect(jsonPath("$.salaryMin").value(15000))
                .andExpect(jsonPath("$.salaryMax").value(20000))
                .andExpect(jsonPath("$.currency").value("EUR"));
    }

    @Test
    @Order(8)
    @DisplayName("DELETE /api/applications/{id} - usuwa aplikacje")
    void deleteApplication_RemovesFromDatabase() throws Exception {
        Application app = createTestApplication("ToDelete", "Dev");
        Long id = app.getId();

        mockMvc.perform(delete("/api/applications/" + id))
                .andExpect(status().isNoContent());

        assertFalse(applicationRepository.findById(id).isPresent());
    }

    // ==================== ETAP 2: Duplikaty ====================

    @Test
    @Order(9)
    @DisplayName("GET /api/applications/check-duplicate - wykrywa duplikaty")
    void checkDuplicate_FindsExistingApplication() throws Exception {
        createTestApplication("Google", "Junior Dev");

        mockMvc.perform(get("/api/applications/check-duplicate")
                .param("company", "Google")
                .param("position", "Junior Dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].company").value("Google"));
    }

    @Test
    @Order(10)
    @DisplayName("GET /api/applications/check-duplicate - duplikaty sa case-insensitive")
    void checkDuplicate_CaseInsensitive() throws Exception {
        createTestApplication("Google", "Junior Dev");

        mockMvc.perform(get("/api/applications/check-duplicate")
                .param("company", "GOOGLE")
                .param("position", "junior dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // ==================== ETAP 3: Kanban - zmiana statusow ====================

    @Test
    @Order(11)
    @DisplayName("PATCH /api/applications/{id}/status - zmienia status aplikacji")
    void updateStatus_ChangesApplicationStatus() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        Map<String, Object> statusRequest = new HashMap<>();
        statusRequest.put("status", "W_PROCESIE");

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("W_PROCESIE"));
    }

    @Test
    @Order(12)
    @DisplayName("PATCH /api/applications/{id}/stage - zmiana na W_PROCESIE z etapem")
    void updateStage_ToInProcess_SetsStage() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("status", "W_PROCESIE");
        stageRequest.put("currentStage", "Rozmowa z HR");

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("W_PROCESIE"))
                .andExpect(jsonPath("$.currentStage").value("Rozmowa z HR"));
    }

    @Test
    @Order(13)
    @DisplayName("PATCH /api/applications/{id}/stage - zmiana etapu (Rozmowa techniczna)")
    void updateStage_ChangeStage_UpdatesCurrentStage() throws Exception {
        Application app = createTestApplication("Google", "Dev");
        app.setStatus(ApplicationStatus.W_PROCESIE);
        app.setCurrentStage("Rozmowa z HR");
        applicationRepository.save(app);

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("status", "W_PROCESIE");
        stageRequest.put("currentStage", "Rozmowa techniczna");

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStage").value("Rozmowa techniczna"));
    }

    @Test
    @Order(14)
    @DisplayName("PATCH /api/applications/{id}/stage - zmiana na ODMOWA z powodem")
    void updateStage_ToRejection_SetsReason() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("status", "ODMOWA");
        stageRequest.put("rejectionReason", "BRAK_ODPOWIEDZI");

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ODMOWA"))
                .andExpect(jsonPath("$.rejectionReason").value("BRAK_ODPOWIEDZI"));
    }

    @Test
    @Order(15)
    @DisplayName("PATCH /api/applications/{id}/stage - zmiana na OFERTA")
    void updateStage_ToOffer_SetsStatus() throws Exception {
        Application app = createTestApplication("Google", "Dev");

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("status", "OFERTA");

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OFERTA"));
    }

    @Test
    @Order(16)
    @DisplayName("PATCH /api/applications/{id}/stage - cofniecie do WYSLANE resetuje dane")
    void updateStage_BackToSent_ClearsData() throws Exception {
        Application app = createTestApplication("Google", "Dev");
        app.setStatus(ApplicationStatus.ODMOWA);
        app.setRejectionReason(RejectionReason.BRAK_ODPOWIEDZI);
        app.setCurrentStage("Rozmowa techniczna");
        applicationRepository.save(app);

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("status", "WYSLANE");
        stageRequest.put("currentStage", null);
        stageRequest.put("rejectionReason", null);

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WYSLANE"))
                .andExpect(jsonPath("$.currentStage").isEmpty())
                .andExpect(jsonPath("$.rejectionReason").isEmpty());
    }

    @Test
    @Order(17)
    @DisplayName("POST /api/applications/{id}/stage - dodaje nowy etap do historii")
    void addStage_AddsNewStageToHistory() throws Exception {
        Application app = createTestApplication("Google", "Dev");
        app.setStatus(ApplicationStatus.W_PROCESIE);
        applicationRepository.save(app);

        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("stageName", "Rozmowa z CEO");

        mockMvc.perform(post("/api/applications/" + app.getId() + "/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStage").value("Rozmowa z CEO"))
                .andExpect(jsonPath("$.stageHistory").isArray())
                .andExpect(jsonPath("$.stageHistory[?(@.stageName == 'Rozmowa z CEO')]").exists());
    }

    @Test
    @Order(18)
    @DisplayName("POST /api/applications/{id}/stage - zwraca 404 dla nieistniejącej aplikacji")
    void addStage_NotFound_Returns404() throws Exception {
        Map<String, Object> stageRequest = new HashMap<>();
        stageRequest.put("stageName", "Test");

        mockMvc.perform(post("/api/applications/99999/stage")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(stageRequest)))
                .andExpect(status().isNotFound());
    }

    // ==================== ETAP 4: CV Assignment ====================

    @Test
    @Order(19)
    @DisplayName("PATCH /api/applications/{id}/cv - przypisuje CV do aplikacji")
    void assignCV_ToApplication_Success() throws Exception {
        Application app = createTestApplication("Google", "Dev");
        CV cv = createTestCV("TestCV.pdf", CVType.NOTE);

        Map<String, Object> cvRequest = new HashMap<>();
        cvRequest.put("cvId", cv.getId());

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/cv")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cvRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cvId").value(cv.getId()))
                .andExpect(jsonPath("$.cvFileName").value("TestCV.pdf"));
    }

    @Test
    @Order(20)
    @DisplayName("PATCH /api/applications/{id}/cv - usuwa przypisanie CV (null)")
    void removeCV_FromApplication_Success() throws Exception {
        CV cv = createTestCV("TestCV.pdf", CVType.NOTE);
        Application app = createTestApplication("Google", "Dev");
        app.setCv(cv);
        applicationRepository.save(app);

        Map<String, Object> cvRequest = new HashMap<>();
        cvRequest.put("cvId", null);

        mockMvc.perform(patch("/api/applications/" + app.getId() + "/cv")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cvRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cvId").isEmpty())
                .andExpect(jsonPath("$.cvFileName").isEmpty());
    }

    // ==================== Helper methods ====================

    private Application createTestApplication(String company, String position) {
        Application app = new Application();
        app.setCompany(company);
        app.setPosition(position);
        app.setSalaryMin(5000);
        app.setCurrency("PLN");
        app.setStatus(ApplicationStatus.WYSLANE);
        app.setUser(testUser);
        return applicationRepository.save(app);
    }

    private CV createTestCV(String name, CVType type) {
        CV cv = new CV();
        cv.setOriginalFileName(name);
        cv.setType(type);
        cv.setUser(testUser);
        return cvRepository.save(cv);
    }
}
