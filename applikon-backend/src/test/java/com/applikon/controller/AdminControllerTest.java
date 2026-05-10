package com.applikon.controller;

import com.applikon.repository.ServiceNoticeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ServiceNoticeRepository noticeRepository;

    @BeforeEach
    void setUp() {
        noticeRepository.deleteAll();
    }

    @Test
    @Order(1)
    void createNotice_withValidKey_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "BANNER",
                "messagePl", "Testowy komunikat",
                "messageEn", "Test message"
        ));

        mockMvc.perform(post("/api/admin/notices")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("BANNER"))
                .andExpect(jsonPath("$.messagePl").value("Testowy komunikat"));
    }

    @Test
    @Order(2)
    void createNotice_withoutKey_returns403() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "BANNER",
                "messagePl", "Test",
                "messageEn", "Test"
        ));

        mockMvc.perform(post("/api/admin/notices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(3)
    void createNotice_withWrongKey_returns403() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "BANNER",
                "messagePl", "Test",
                "messageEn", "Test"
        ));

        mockMvc.perform(post("/api/admin/notices")
                        .header("X-Admin-Key", "wrong-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    void createNotice_withMissingFields_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "type", "BANNER",
                "messagePl", ""
        ));

        mockMvc.perform(post("/api/admin/notices")
                        .header("X-Admin-Key", "test-admin-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
