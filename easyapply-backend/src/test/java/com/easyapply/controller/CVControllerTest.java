package com.easyapply.controller;

import com.easyapply.entity.CV;
import com.easyapply.entity.CVType;
import com.easyapply.entity.User;
import com.easyapply.repository.ApplicationRepository;
import com.easyapply.repository.CVRepository;
import com.easyapply.repository.UserRepository;
import com.easyapply.security.AuthenticatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
class CVControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CVRepository cvRepository;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        applicationRepository.deleteAll();
        cvRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User("test@example.com", "Test User", "google-test-cv"));

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

    // ==================== ETAP 4: CV CRUD Tests ====================

    @Test
    @Order(1)
    @DisplayName("GET /api/cv - returns list of all CVs")
    void getAllCVs_ReturnsListOfCVs() throws Exception {
        createTestCV("CV1.pdf", CVType.FILE);
        createTestCV("CV2.pdf", CVType.LINK);
        createTestCV("CV3.pdf", CVType.NOTE);

        mockMvc.perform(get("/api/cv"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].originalFileName",
                    containsInAnyOrder("CV1.pdf", "CV2.pdf", "CV3.pdf")));
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/cv - creates CV of type LINK")
    void createCV_TypeLink_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "CV_Frontend.pdf");
        request.put("type", "LINK");
        request.put("externalUrl", "https://drive.google.com/testlink");

        mockMvc.perform(post("/api/cv")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.originalFileName").value("CV_Frontend.pdf"))
                .andExpect(jsonPath("$.type").value("LINK"))
                .andExpect(jsonPath("$.externalUrl").value("https://drive.google.com/testlink"));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/cv - creates CV of type NOTE (no URL)")
    void createCV_TypeNote_Success() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("name", "CV_Local.pdf");
        request.put("type", "NOTE");

        mockMvc.perform(post("/api/cv")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.originalFileName").value("CV_Local.pdf"))
                .andExpect(jsonPath("$.type").value("NOTE"))
                .andExpect(jsonPath("$.externalUrl").isEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/cv/{id} - returns CV details")
    void getCVById_ReturnsCV() throws Exception {
        CV cv = createTestCV("TestCV.pdf", CVType.FILE);

        mockMvc.perform(get("/api/cv/" + cv.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(cv.getId()))
                .andExpect(jsonPath("$.originalFileName").value("TestCV.pdf"))
                .andExpect(jsonPath("$.type").value("FILE"));
    }

    @Test
    @Order(5)
    @DisplayName("PUT /api/cv/{id} - updates CV name and URL")
    void updateCV_ChangesNameAndUrl() throws Exception {
        CV cv = createTestCV("OldName.pdf", CVType.LINK);
        cv.setExternalUrl("https://old.url");
        cvRepository.save(cv);

        Map<String, Object> updateRequest = new HashMap<>();
        updateRequest.put("name", "NewName.pdf");
        updateRequest.put("externalUrl", "https://new.url");

        mockMvc.perform(put("/api/cv/" + cv.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalFileName").value("NewName.pdf"))
                .andExpect(jsonPath("$.externalUrl").value("https://new.url"));
    }

    @Test
    @Order(6)
    @DisplayName("DELETE /api/cv/{id} - removes CV")
    void deleteCV_RemovesFromDatabase() throws Exception {
        CV cv = createTestCV("ToDelete.pdf", CVType.NOTE);
        Long id = cv.getId();

        mockMvc.perform(delete("/api/cv/" + id))
                .andExpect(status().isNoContent());

        assertFalse(cvRepository.findById(id).isPresent());
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/cv/upload - validation: only PDF allowed")
    void uploadCV_NonPDF_ReturnsBadRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                "text/plain",
                "This is not a PDF".getBytes()
        );

        mockMvc.perform(multipart("/api/cv/upload").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/cv/upload - uploads PDF file")
    void uploadCV_ValidPDF_Success() throws Exception {
        byte[] pdfContent = "%PDF-1.4\n%Test PDF content\n%%EOF".getBytes();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "TestCV.pdf",
                "application/pdf",
                pdfContent
        );

        mockMvc.perform(multipart("/api/cv/upload").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.originalFileName").value("TestCV.pdf"))
                .andExpect(jsonPath("$.type").value("FILE"))
                .andExpect(jsonPath("$.fileSize").value(pdfContent.length));
    }

    @Test
    @Order(9)
    @DisplayName("GET /api/cv - returns CVs of different types")
    void getAllCVs_ContainsDifferentTypes() throws Exception {
        createTestCV("File.pdf", CVType.FILE);
        createTestCV("Link.pdf", CVType.LINK);
        createTestCV("Note.pdf", CVType.NOTE);

        mockMvc.perform(get("/api/cv"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type=='FILE')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='LINK')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='NOTE')]", hasSize(1)));
    }

    // ==================== Helper methods ====================

    private CV createTestCV(String name, CVType type) {
        CV cv = new CV();
        cv.setOriginalFileName(name);
        cv.setType(type);
        cv.setUser(testUser);

        if (type == CVType.FILE) {
            cv.setFileName("uuid_" + name);
            cv.setFileSize(1024L);
        }
        if (type == CVType.LINK) {
            cv.setExternalUrl("https://example.com/" + name);
        }
        return cvRepository.save(cv);
    }
}
