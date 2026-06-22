package com.rapidfix.technician.controller;

import com.rapidfix.technician.config.security.SecurityConfig;
import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.AvailabilityStatus;
import com.rapidfix.technician.entity.ServiceType;
import com.rapidfix.technician.exception.ResourceNotFoundException;
import com.rapidfix.technician.security.JwtUtil;
import com.rapidfix.technician.service.TechnicianService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TechnicianController.class)
@Import(SecurityConfig.class)
class TechnicianControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean TechnicianService service;
    @MockBean JwtUtil jwtUtil;
    @Autowired ObjectMapper objectMapper;

    // ── helpers ──────────────────────────────────────────────

    private TechnicianResponse buildResponse() {
        return TechnicianResponse.builder()
                .id(1L)
                .userId(10L)
                .name("John")
                .email("john@test.com")
                .phone("9876543210")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .rating(4.5)
                .completedJobs(5)
                .build();
    }

    private TechnicianRequest buildRequest() {
        return TechnicianRequest.builder()
                .phone("9876543210")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .latitude(17.385)
                .longitude(78.486)
                .build();
    }

    // ── register tests ────────────────────────────────────────

    @Test
    @WithMockUser(roles = "TECHNICIAN")
    void register_returns201() throws Exception {
        when(jwtUtil.extractEmail(any())).thenReturn("john@test.com");
        when(jwtUtil.extractName(any())).thenReturn("John");
        when(jwtUtil.extractUserId(any())).thenReturn(10L);
        when(service.registerTechnician(any(), any(), any(), any())).thenReturn(buildResponse());

        mockMvc.perform(post("/api/technicians")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.phone").value("9876543210"));
    }

    @Test
    void register_missingPhone_returns400() throws Exception {
        TechnicianRequest bad = TechnicianRequest.builder()
                .phone("")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .build();

        mockMvc.perform(post("/api/technicians")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_emptyServiceTypes_returns400() throws Exception {
        TechnicianRequest bad = TechnicianRequest.builder()
                .phone("9876543210")
                .serviceTypes(Set.of())
                .build();

        mockMvc.perform(post("/api/technicians")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── getById tests ─────────────────────────────────────────

    @Test
    void getById_returns200() throws Exception {
        when(service.getTechnicianById(1L)).thenReturn(buildResponse());

        mockMvc.perform(get("/api/technicians/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.getTechnicianById(99L))
                .thenThrow(new ResourceNotFoundException("Not found"));

        mockMvc.perform(get("/api/technicians/99"))
                .andExpect(status().isNotFound());
    }

    // ── getByUserId tests ─────────────────────────────────────

    @Test
    void getByUserId_returns200() throws Exception {
        when(service.getTechnicianByUserId(10L)).thenReturn(buildResponse());

        mockMvc.perform(get("/api/technicians/user/10").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10L));
    }

    @Test
    void getByUserId_notFound_returns404() throws Exception {
        when(service.getTechnicianByUserId(99L))
                .thenThrow(new ResourceNotFoundException("Not found"));

        mockMvc.perform(get("/api/technicians/user/99").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isNotFound());
    }

    // ── updateAvailability tests ──────────────────────────────

    @Test
    void updateAvailability_toAvailable_returns200() throws Exception {
        TechnicianResponse res = buildResponse();
        when(service.updateAvailability(1L, AvailabilityStatus.AVAILABLE)).thenReturn(res);

        mockMvc.perform(patch("/api/technicians/1/availability")
                        .header("Authorization", "Bearer mock-token")
                        .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"));
    }

    @Test
    void updateAvailability_toBusy_returns200() throws Exception {
        TechnicianResponse res = buildResponse();
        res.setAvailabilityStatus(AvailabilityStatus.BUSY);
        when(service.updateAvailability(1L, AvailabilityStatus.BUSY)).thenReturn(res);

        mockMvc.perform(patch("/api/technicians/1/availability")
                        .header("Authorization", "Bearer mock-token")
                        .param("status", "BUSY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("BUSY"));
    }

    // ── updateLocation tests ──────────────────────────────────

    @Test
    @WithMockUser(roles = "TECHNICIAN")
    void updateLocation_returns200() throws Exception {
        LocationUpdateRequest req = new LocationUpdateRequest(17.385, 78.486);
        when(service.updateLocation(eq(1L), any())).thenReturn(buildResponse());

        mockMvc.perform(patch("/api/technicians/1/location")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void updateLocation_missingLatitude_returns400() throws Exception {
        LocationUpdateRequest bad = new LocationUpdateRequest(null, 78.486);

        mockMvc.perform(patch("/api/technicians/1/location")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── updateProfile tests ───────────────────────────────────

    @Test
    @WithMockUser(roles = "TECHNICIAN")
    void updateProfile_returns200() throws Exception {
        TechnicianProfileUpdateRequest req = new TechnicianProfileUpdateRequest("9999999999", Set.of(ServiceType.PLUMBER));
        when(jwtUtil.extractUserId(any())).thenReturn(10L);
        when(service.updateProfile(eq(10L), any())).thenReturn(buildResponse());

        mockMvc.perform(put("/api/technicians/profile")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    // ── rating tests ──────────────────────────────────────────

    @Test
    @WithMockUser(roles = "USER")
    void rateAndComplete_returns200() throws Exception {
        RatingRequest req = new RatingRequest(5);
        when(service.updateRatingByUserId(eq(1L), any())).thenReturn(buildResponse());

        mockMvc.perform(patch("/api/technicians/1/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void rateAndComplete_ratingAbove5_returns400() throws Exception {
        RatingRequest bad = new RatingRequest(6);

        mockMvc.perform(patch("/api/technicians/1/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rateAndComplete_ratingBelow1_returns400() throws Exception {
        RatingRequest bad = new RatingRequest(0);

        mockMvc.perform(patch("/api/technicians/1/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── findNearby tests ──────────────────────────────────────

    @Test
    void findNearby_returns200() throws Exception {
        NearbyTechnicianResponse nearby = NearbyTechnicianResponse.builder()
                .id(1L).name("John").distanceKm(2.5).rating(4.5)
                .build();
        when(service.findNearbyAvailable(any(), any(), any(), any()))
                .thenReturn(List.of(nearby));

        mockMvc.perform(get("/api/technicians/nearby")
                        .param("latitude", "17.385")
                        .param("longitude", "78.486")
                        .param("radiusKm", "10.0")
                        .param("serviceType", "ELECTRICIAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("John"))
                .andExpect(jsonPath("$[0].distanceKm").value(2.5));
    }

    @Test
    void findNearby_noResults_returnsEmptyList() throws Exception {
        when(service.findNearbyAvailable(any(), any(), any(), any()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/technicians/nearby")
                        .param("latitude", "17.385")
                        .param("longitude", "78.486"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // ── delete tests ──────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_returns204() throws Exception {
        doNothing().when(service).deleteTechnician(1L);

        mockMvc.perform(delete("/api/technicians/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_notFound_returns404() throws Exception {
        doThrow(new ResourceNotFoundException("Not found"))
                .when(service).deleteTechnician(99L);

        mockMvc.perform(delete("/api/technicians/99"))
                .andExpect(status().isNotFound());
    }
}