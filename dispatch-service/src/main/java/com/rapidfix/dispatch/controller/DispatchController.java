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
                        jwtUtil.extractUserId(token), jwtUtil.extractEmail(token)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service request by ID")
    public ResponseEntity<ServiceRequestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.getRequestById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all requests by user (paginated)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dispatchService.getRequestsByUser(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/technician/{technicianId}")
    @Operation(summary = "Get all jobs for a technician (paginated)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getByTechnician(
            @PathVariable Long technicianId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dispatchService.getRequestsByTechnician(technicianId,
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
    public ResponseEntity<ServiceRequestResponse> markAsRated(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.markAsRated(id));
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Browse all PENDING requests by service type (TECHNICIAN only)")
    public ResponseEntity<PagedResponse<ServiceRequestResponse>> getAvailableRequests(
            @RequestParam ServiceType serviceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(dispatchService.getAvailableRequestsByServiceType(
                serviceType, PageRequest.of(page, size, Sort.by("createdAt").descending())));
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
                jwtUtil.extractUserId(token), jwtUtil.extractName(token)));
    }

    @PostMapping("/{id}/approve-quote")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Approve the technician's quote — technician will now visit (USER only)")
    public ResponseEntity<ServiceRequestResponse> approveQuote(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.approveQuote(id));
    }

    @PostMapping("/{id}/reject-quote")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Reject the quote — request returns to PENDING for other technicians (USER only)")
    public ResponseEntity<ServiceRequestResponse> rejectQuote(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.rejectQuote(id));
    }

    @PatchMapping("/{id}/in-progress")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Mark arrived on site and working (TECHNICIAN only — only after quote approved)")
    public ResponseEntity<ServiceRequestResponse> markInProgress(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.markInProgress(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Complete the job with actual hours worked (TECHNICIAN only)")
    public ResponseEntity<ServiceRequestResponse> complete(
            @PathVariable Long id,
            @Valid @RequestBody CompletionRequest completion) {
        return ResponseEntity.ok(dispatchService.completeRequest(id, completion));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Cancel a service request (USER or ADMIN)")
    public ResponseEntity<ServiceRequestResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(dispatchService.cancelRequest(id));
    }

    @PatchMapping("/{id}/withdraw-quote")
    public ResponseEntity<ServiceRequestResponse> withdrawQuote(
            @PathVariable Long id,
            @RequestParam Long technicianId) {
        return ResponseEntity.ok(dispatchService.withdrawQuote(id, technicianId));
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer "))
            return header.substring(7);
        throw new RuntimeException("Missing Authorization header");
    }
}