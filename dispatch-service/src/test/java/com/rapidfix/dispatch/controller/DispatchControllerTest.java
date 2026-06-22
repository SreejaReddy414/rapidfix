package com.rapidfix.dispatch.controller;

import com.rapidfix.dispatch.dto.*;
import com.rapidfix.dispatch.entity.RequestStatus;
import com.rapidfix.dispatch.entity.ServiceType;
import com.rapidfix.dispatch.exception.InvalidStateException;
import com.rapidfix.dispatch.exception.ResourceNotFoundException;
import com.rapidfix.dispatch.security.JwtUtil;
import com.rapidfix.dispatch.service.DispatchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DispatchController.class)
@AutoConfigureMockMvc(addFilters = false) // disable JWT filter for controller tests
class DispatchControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean DispatchService dispatchService;
    @MockBean JwtUtil jwtUtil;
    @Autowired ObjectMapper objectMapper;

    // ── helpers ──────────────────────────────────────────────

    private ServiceRequestResponse buildResponse(RequestStatus status) {
        return ServiceRequestResponse.builder()
                .id(1L)
                .userId(10L)
                .userName("alice@test.com")
                .serviceType(ServiceType.ELECTRICIAN)
                .description("Power outage in kitchen")
                .address("42 MG Road, Hyderabad")
                .userLatitude(17.387)
                .userLongitude(78.489)
                .status(status)
                .build();
    }

    private ServiceRequestCreate buildCreateRequest() {
        return ServiceRequestCreate.builder()
                .serviceType(ServiceType.ELECTRICIAN)
                .description("Power outage in kitchen needs fix")
                .userLatitude(17.387)
                .userLongitude(78.489)
                .address("42 MG Road, Hyderabad")
                .build();
    }

    private QuoteRequest buildQuoteRequest() {
        return QuoteRequest.builder()
                .hourlyRate(150.0)
                .estimatedHours(2.0)
                .applianceCharge(0.0)
                .quoteNote("Will check wiring")
                .build();
    }

    private CompletionRequest buildCompletionRequest() {
        return CompletionRequest.builder()
                .actualHours(2.5)
                .actualApplianceCharge(0.0)
                .completionNote("Fixed wiring issue")
                .build();
    }

    // ── create tests ──────────────────────────────────────────

    @Test
    void create_returns201() throws Exception {
        when(jwtUtil.extractUserId(any())).thenReturn(10L);
        when(jwtUtil.extractEmail(any())).thenReturn("alice@test.com");
        when(dispatchService.createRequest(any(), any(), any()))
                .thenReturn(buildResponse(RequestStatus.PENDING));

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildCreateRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.serviceType").value("ELECTRICIAN"));
    }

    @Test
    void create_missingServiceType_returns400() throws Exception {
        ServiceRequestCreate bad = ServiceRequestCreate.builder()
                .description("Power outage in kitchen needs fix")
                .userLatitude(17.387)
                .userLongitude(78.489)
                .address("42 MG Road")
                .build();

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_shortDescription_returns400() throws Exception {
        ServiceRequestCreate bad = ServiceRequestCreate.builder()
                .serviceType(ServiceType.ELECTRICIAN)
                .description("short")   // less than 10 chars
                .userLatitude(17.387)
                .userLongitude(78.489)
                .address("42 MG Road")
                .build();

        mockMvc.perform(post("/api/requests")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── getById tests ─────────────────────────────────────────

    @Test
    void getById_returns200() throws Exception {
        when(dispatchService.getRequestById(1L))
                .thenReturn(buildResponse(RequestStatus.PENDING));

        mockMvc.perform(get("/api/requests/1").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(dispatchService.getRequestById(99L))
                .thenThrow(new ResourceNotFoundException("Request not found"));

        mockMvc.perform(get("/api/requests/99").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isNotFound());
    }

    // ── getByUser tests ───────────────────────────────────────

    @Test
    void getByUser_returns200() throws Exception {
        PagedResponse<ServiceRequestResponse> paged = PagedResponse.<ServiceRequestResponse>builder()
                .content(List.of(buildResponse(RequestStatus.PENDING)))
                .page(0).size(10).totalElements(1).totalPages(1).last(true)
                .build();
        when(jwtUtil.extractUserId(any())).thenReturn(10L);
        when(dispatchService.getRequestsByUser(eq(10L), any())).thenReturn(paged);

        mockMvc.perform(get("/api/requests/my-requests").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ── getByTechnician tests ─────────────────────────────────

    @Test
    void getByTechnician_returns200() throws Exception {
        PagedResponse<ServiceRequestResponse> paged = PagedResponse.<ServiceRequestResponse>builder()
                .content(List.of(buildResponse(RequestStatus.QUOTED)))
                .page(0).size(10).totalElements(1).totalPages(1).last(true)
                .build();
        when(jwtUtil.extractUserId(any())).thenReturn(5L);
        when(dispatchService.getRequestsByTechnician(eq(5L), any())).thenReturn(paged);

        mockMvc.perform(get("/api/requests/my-jobs").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("QUOTED"));
    }

    // ── submitQuote tests ─────────────────────────────────────

    @Test
    void submitQuote_returns200() throws Exception {
        when(jwtUtil.extractUserId(any())).thenReturn(5L);
        when(jwtUtil.extractName(any())).thenReturn("John");
        when(dispatchService.submitQuote(eq(1L), any(), any(), any()))
                .thenReturn(buildResponse(RequestStatus.QUOTED));

        mockMvc.perform(post("/api/requests/1/quote")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildQuoteRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUOTED"));
    }

    @Test
    void submitQuote_alreadyQuoted_returns409() throws Exception {
        when(jwtUtil.extractUserId(any())).thenReturn(5L);
        when(jwtUtil.extractName(any())).thenReturn("John");
        when(dispatchService.submitQuote(eq(1L), any(), any(), any()))
                .thenThrow(new InvalidStateException("Request is not PENDING"));

        mockMvc.perform(post("/api/requests/1/quote")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildQuoteRequest())))
                .andExpect(status().isConflict());
    }

    // ── approveQuote tests ────────────────────────────────────

    @Test
    void approveQuote_returns200() throws Exception {
        when(dispatchService.approveQuote(eq(1L), eq(20L)))
                .thenReturn(buildResponse(RequestStatus.APPROVED));

        mockMvc.perform(post("/api/requests/1/approve-quote")
                        .header("Authorization", "Bearer mock-token")
                        .param("technicianId", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void approveQuote_notQuoted_returns409() throws Exception {
        when(dispatchService.approveQuote(eq(1L), eq(20L)))
                .thenThrow(new InvalidStateException("Request is not QUOTED"));

        mockMvc.perform(post("/api/requests/1/approve-quote")
                        .header("Authorization", "Bearer mock-token")
                        .param("technicianId", "20"))
                .andExpect(status().isConflict());
    }

    // ── rejectQuote tests ─────────────────────────────────────

    @Test
    void rejectQuote_returns200() throws Exception {
        when(dispatchService.rejectQuote(eq(1L), eq(20L)))
                .thenReturn(buildResponse(RequestStatus.PENDING));

        mockMvc.perform(post("/api/requests/1/reject-quote")
                        .header("Authorization", "Bearer mock-token")
                        .param("technicianId", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    // ── withdrawQuote tests ───────────────────────────────────

    @Test
    void withdrawQuote_returns200() throws Exception {
        when(jwtUtil.extractUserId(any())).thenReturn(5L);
        when(dispatchService.withdrawQuote(1L, 5L))
                .thenReturn(buildResponse(RequestStatus.PENDING));

        mockMvc.perform(patch("/api/requests/1/withdraw-quote")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void withdrawQuote_wrongTechnician_returns409() throws Exception {
        when(jwtUtil.extractUserId(any())).thenReturn(99L);
        when(dispatchService.withdrawQuote(1L, 99L))
                .thenThrow(new InvalidStateException("This is not your quote"));

        mockMvc.perform(patch("/api/requests/1/withdraw-quote")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isConflict());
    }

    // ── markInProgress tests ──────────────────────────────────

    @Test
    void markInProgress_returns200() throws Exception {
        when(dispatchService.markInProgress(1L))
                .thenReturn(buildResponse(RequestStatus.IN_PROGRESS));

        mockMvc.perform(patch("/api/requests/1/in-progress").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void markInProgress_notApproved_returns409() throws Exception {
        when(dispatchService.markInProgress(1L))
                .thenThrow(new InvalidStateException("Request is not APPROVED"));

        mockMvc.perform(patch("/api/requests/1/in-progress").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isConflict());
    }

    // ── complete tests ────────────────────────────────────────

    @Test
    void complete_returns200() throws Exception {
        when(dispatchService.completeRequest(eq(1L), any()))
                .thenReturn(buildResponse(RequestStatus.COMPLETED));

        mockMvc.perform(patch("/api/requests/1/complete")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildCompletionRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void complete_missingActualHours_returns400() throws Exception {
        CompletionRequest bad = CompletionRequest.builder()
                .actualHours(null)
                .actualApplianceCharge(0.0)
                .build();

        mockMvc.perform(patch("/api/requests/1/complete")
                        .header("Authorization", "Bearer mock-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
    }

    // ── cancel tests ──────────────────────────────────────────

    @Test
    void cancel_returns200() throws Exception {
        when(dispatchService.cancelRequest(1L))
                .thenReturn(buildResponse(RequestStatus.CANCELLED));

        mockMvc.perform(patch("/api/requests/1/cancel").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancel_alreadyCompleted_returns409() throws Exception {
        when(dispatchService.cancelRequest(1L))
                .thenThrow(new InvalidStateException("Cannot cancel COMPLETED request"));

        mockMvc.perform(patch("/api/requests/1/cancel").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isConflict());
    }

    // ── markAsRated tests ─────────────────────────────────────

    @Test
    void markAsRated_returns200() throws Exception {
        ServiceRequestResponse rated = buildResponse(RequestStatus.COMPLETED);
        rated.setRated(true);
        when(dispatchService.markAsRated(1L)).thenReturn(rated);

        mockMvc.perform(patch("/api/requests/1/mark-rated").header("Authorization", "Bearer mock-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rated").value(true));
    }

    // ── getAvailable tests ────────────────────────────────────

    @Test
    void getAvailable_returns200() throws Exception {
        PagedResponse<ServiceRequestResponse> paged = PagedResponse.<ServiceRequestResponse>builder()
                .content(List.of(buildResponse(RequestStatus.PENDING)))
                .page(0).size(10).totalElements(1).totalPages(1).last(true)
                .build();
        when(dispatchService.getAvailableRequestsByServiceType(any(), any(), any())).thenReturn(paged);

        mockMvc.perform(get("/api/requests/available")
                        .header("Authorization", "Bearer mock-token")
                        .param("serviceType", "ELECTRICIAN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }
}