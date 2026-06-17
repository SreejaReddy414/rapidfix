package com.rapidfix.user.controller;

import com.rapidfix.user.config.security.SecurityConfig;
import com.rapidfix.user.dto.PagedResponse;
import com.rapidfix.user.dto.UserRequest;
import com.rapidfix.user.dto.UserResponse;
import com.rapidfix.user.exception.ResourceNotFoundException;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)

class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean UserService userService;
    @Autowired ObjectMapper objectMapper;
    @MockBean com.rapidfix.user.security.JwtUtil jwtUtil;
    // ── helpers ──────────────────────────────────────────────

    private UserResponse buildResponse() {
        return new UserResponse(1L, "Alice", "alice@test.com", "USER", null);
    }

    private UserRequest buildRequest() {
        return new UserRequest("Alice", "alice@test.com", "pass123", "USER");
    }

    // ── getUser tests ─────────────────────────────────────────

    @Test
    void getUser_returns200() throws Exception {
        when(userService.getUserById(1L)).thenReturn(buildResponse());

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("alice@test.com"));
    }

    @Test
    void getUser_notFound_returns404() throws Exception {
        when(userService.getUserById(99L))
                .thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound());
    }

    // ── getAllUsers tests ──────────────────────────────────────

    @Test
    void getAllUsers_returns200() throws Exception {
        PagedResponse<UserResponse> paged = PagedResponse.<UserResponse>builder()
                .content(List.of(buildResponse()))
                .page(0).size(10).totalElements(1).totalPages(1).last(true)
                .build();
        when(userService.getAllUsers(any())).thenReturn(paged);

        mockMvc.perform(get("/api/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("alice@test.com"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ── updateUser tests ──────────────────────────────────────

    @Test
    void updateUser_returns200() throws Exception {
        UserResponse updated = new UserResponse(1L, "Alice Updated", "alice@test.com", "USER", null);
        when(userService.updateUser(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Updated"));
    }

    @Test
    void updateUser_notFound_returns404() throws Exception {
        when(userService.updateUser(eq(99L), any()))
                .thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(put("/api/users/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest())))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUser_invalidEmail_returns400() throws Exception {
        UserRequest bad = new UserRequest("Alice", "not-an-email", "pass123", "USER");

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── deleteUser tests ──────────────────────────────────────

    @Test
    void deleteUser_returns204() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteUser_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("User not found"))
                .when(userService).deleteUser(99L);

        mockMvc.perform(delete("/api/users/99"))
                .andExpect(status().isNotFound());
    }
}