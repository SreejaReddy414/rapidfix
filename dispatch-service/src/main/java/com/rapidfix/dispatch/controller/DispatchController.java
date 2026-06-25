package com.rapidfix.dispatch.controller;

import com.rapidfix.dispatch.dto.*;
import com.rapidfix.dispatch.entity.RequestStatus;
import com.rapidfix.dispatch.entity.ServiceType;
import com.rapidfix.dispatch.security.JwtUtil;
import com.rapidfix.dispatch.service.DispatchService;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Tag(name = "Dispatch", description = "Service request lifecycle management")
@SecurityRequirement(name = "Bearer")
public class DispatchController {

    private final DispatchService dispatchService;
    private final JwtUtil jwtUtil;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a service request (USER only)")
    public ResponseEntity<ServiceRequestResponse> create(
            @Valid @RequestBody ServiceRequestCreate request,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dispatchService.createRequest(request,
                        getUserIdFromToken(token), getEmailFromToken(token)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service request by ID")
    public ResponseEntity<ServiceRequestResponse> getById(@PathVariable Long id, HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (!"ADMIN".equals(role) && userId != null && userId != 0L &&
                (sr.getUserId() == null || !sr.getUserId().equals(userId)) &&
                (sr.getTechnicianId() == null || !userId.equals(sr.getTechnicianId()))) {
            throw new AccessDeniedException("Access denied. You do not own this request resource.");
        }
        return ResponseEntity.ok(sr);
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get all requests for the currently logged in user (paginated)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getByUser(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        return ResponseEntity.ok(dispatchService.getRequestsByUser(getUserIdFromToken(token),
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/my-jobs")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Get all jobs for the currently logged in technician (paginated)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getByTechnician(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        return ResponseEntity.ok(dispatchService.getRequestsByTechnician(getUserIdFromToken(token),
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all requests by status — ADMIN only")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getByStatus(
            @PathVariable RequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dispatchService.getRequestsByStatus(status,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PatchMapping("/{id}/mark-rated")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Mark a completed request as rated")
    public ResponseEntity<ServiceRequestResponse> markAsRated(@PathVariable Long id, HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (userId != null && userId != 0L && (sr.getUserId() == null || !sr.getUserId().equals(userId))) {
            throw new AccessDeniedException("Access denied. You do not own this request.");
        }
        return ResponseEntity.ok(dispatchService.markAsRated(id));
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Browse all PENDING requests by service type (TECHNICIAN only)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getAvailableRequests(
            @RequestParam ServiceType serviceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long technicianId = getUserIdFromToken(token);
        return ResponseEntity.ok(dispatchService.getAvailableRequestsByServiceType(
                serviceType, technicianId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PostMapping("/{id}/quote")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Submit a price quote before visiting (TECHNICIAN only)",
            description = "hourlyRate × estimatedHours + applianceCharge = total. User must approve before you visit.")
    public ResponseEntity<ServiceRequestResponse> submitQuote(
            @PathVariable Long id,
            @Valid @RequestBody QuoteRequest quoteRequest,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        return ResponseEntity.ok(dispatchService.submitQuote(id, quoteRequest,
                getUserIdFromToken(token), getNameFromToken(token)));
    }

    @PostMapping("/{id}/approve-quote")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Approve the technician's quote — technician will now visit (USER only)")
    public ResponseEntity<ServiceRequestResponse> approveQuote(
            @PathVariable Long id,
            @RequestParam Long technicianId,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (userId != null && userId != 0L && (sr.getUserId() == null || !sr.getUserId().equals(userId))) {
            throw new AccessDeniedException("Access denied. You do not own this request.");
        }
        return ResponseEntity.ok(dispatchService.approveQuote(id, technicianId));
    }

    @PostMapping("/{id}/reject-quote")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Reject the quote — request returns to PENDING for other technicians (USER only)")
    public ResponseEntity<ServiceRequestResponse> rejectQuote(
            @PathVariable Long id,
            @RequestParam Long technicianId,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (userId != null && userId != 0L && (sr.getUserId() == null || !sr.getUserId().equals(userId))) {
            throw new AccessDeniedException("Access denied. You do not own this request.");
        }
        return ResponseEntity.ok(dispatchService.rejectQuote(id, technicianId));
    }

    @GetMapping("/{id}/quotes")
    @Operation(summary = "Get all quotes for a request")
    public ResponseEntity<java.util.List<QuoteResponse>> getQuotes(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.getQuotesForRequest(id));
    }

    @PatchMapping("/{id}/in-progress")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Mark arrived on site and working (TECHNICIAN only — only after quote approved)")
    public ResponseEntity<ServiceRequestResponse> markInProgress(@PathVariable Long id, HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (userId != null && userId != 0L && (sr.getTechnicianId() == null || !userId.equals(sr.getTechnicianId()))) {
            throw new AccessDeniedException("Access denied. You are not the assigned technician.");
        }
        return ResponseEntity.ok(dispatchService.markInProgress(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Complete the job with actual hours worked (TECHNICIAN only)")
    public ResponseEntity<ServiceRequestResponse> complete(
            @PathVariable Long id,
            @Valid @RequestBody CompletionRequest completion,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (userId != null && userId != 0L && (sr.getTechnicianId() == null || !userId.equals(sr.getTechnicianId()))) {
            throw new AccessDeniedException("Access denied. You are not the assigned technician.");
        }
        return ResponseEntity.ok(dispatchService.completeRequest(id, completion));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Cancel a service request (USER or ADMIN)")
    public ResponseEntity<ServiceRequestResponse> cancel(@PathVariable Long id, HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        ServiceRequestResponse sr = dispatchService.getRequestById(id);
        if (!"ADMIN".equals(role) && userId != null && userId != 0L && (sr.getUserId() == null || !sr.getUserId().equals(userId))) {
            throw new AccessDeniedException("Access denied. You cannot cancel this request.");
        }
        return ResponseEntity.ok(dispatchService.cancelRequest(id));
    }

    @PatchMapping("/{id}/withdraw-quote")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ServiceRequestResponse> withdrawQuote(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        return ResponseEntity.ok(dispatchService.withdrawQuote(id, getUserIdFromToken(token)));
    }

    private Long getUserIdFromToken(String token) {
        if (!StringUtils.hasText(token)) return null;
        try { return jwtUtil.extractUserId(token); }
        catch (Exception e) { return null; }
    }

    private String getRoleFromToken(String token) {
        if (!StringUtils.hasText(token)) return null;
        try { return jwtUtil.extractRole(token); }
        catch (Exception e) { return null; }
    }

    private String getNameFromToken(String token) {
        if (!StringUtils.hasText(token)) return null;
        try { return jwtUtil.extractName(token); }
        catch (Exception e) { return null; }
    }

    private String getEmailFromToken(String token) {
        if (!StringUtils.hasText(token)) return null;
        try { return jwtUtil.extractEmail(token); }
        catch (Exception e) { return null; }
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer "))
            return header.substring(7);
        throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
    }
}