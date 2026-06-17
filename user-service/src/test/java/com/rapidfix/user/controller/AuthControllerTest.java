package com.rapidfix.user.controller;

import com.rapidfix.user.config.security.SecurityConfig;
import com.rapidfix.user.dto.LoginRequest;
import com.rapidfix.user.dto.UserRequest;
import com.rapidfix.user.dto.UserResponse;
import com.rapidfix.user.exception.EmailAlreadyExistsException;
import com.rapidfix.user.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean UserService userService;
    @MockBean com.rapidfix.user.security.JwtUtil jwtUtil;
    @Autowired ObjectMapper objectMapper;

    // ── helpers ──────────────────────────────────────────────

    private UserRequest buildRegisterRequest() {
        return new UserRequest("Alice", "alice@test.com", "pass123", "USER");
    }

    private UserResponse buildAuthResponse() {
        return new UserResponse(1L, "Alice", "alice@test.com", "USER", "mock-token");
    }

    // ── register tests ────────────────────────────────────────

    @Test
    void register_returns201() throws Exception {
        when(userService.register(any())).thenReturn(buildAuthResponse());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-token"))
                .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        when(userService.register(any()))
                .thenThrow(new EmailAlreadyExistsException("Email already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterRequest())))
                .andExpect(status().isConflict());
    }

    @Test
    void register_missingName_returns400() throws Exception {
        // name is blank — should fail @NotBlank validation
        UserRequest req = new UserRequest("", "alice@test.com", "pass123", "USER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        UserRequest req = new UserRequest("Alice", "not-an-email", "pass123", "USER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── login tests ───────────────────────────────────────────

    @Test
    void login_returns200() throws Exception {
        LoginRequest req = new LoginRequest("alice@test.com", "pass123");
        when(userService.login(any())).thenReturn(buildAuthResponse());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@test.com"))
                .andExpect(jsonPath("$.token").value("mock-token"));
    }

    @Test
    void login_missingEmail_returns400() throws Exception {
        // email is blank — fails @NotBlank
        LoginRequest req = new LoginRequest("", "pass123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_missingPassword_returns400() throws Exception {
        LoginRequest req = new LoginRequest("alice@test.com", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}