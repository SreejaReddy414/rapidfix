package com.rapidfix.technician.controller;

import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.*;
import com.rapidfix.technician.security.JwtUtil;
import com.rapidfix.technician.service.TechnicianService;
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
import java.util.List;

@RestController
@RequestMapping("/api/technicians")
@RequiredArgsConstructor
@Tag(name = "Technicians") @SecurityRequirement(name = "Bearer")
public class TechnicianController {

    private final TechnicianService service;
    private final JwtUtil jwtUtil;

    @PostMapping
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Register technician profile (TECHNICIAN only). Name & email auto-filled from JWT.")
    public ResponseEntity<TechnicianResponse> register(
            @Valid @RequestBody TechnicianRequest request,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        String email = getEmailFromToken(token);
        String name  = getNameFromToken(token);
        Long userId  = getUserIdFromToken(token);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.registerTechnician(request, userId, name, email));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get technician by ID")
    public ResponseEntity<TechnicianResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getTechnicianById(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get technician profile by userId")
    public ResponseEntity<TechnicianResponse> getByUserId(@PathVariable Long userId, HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long loggedUserId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        if ("TECHNICIAN".equals(role) && loggedUserId != null && loggedUserId != 0L && !loggedUserId.equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied. Technicians can only view their own profile.");
        }
        return ResponseEntity.ok(service.getTechnicianByUserId(userId));
    }

    @GetMapping
    @Operation(summary = "List all technicians with pagination")
    public ResponseEntity<PagedResponse<TechnicianResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        return ResponseEntity.ok(service.getAllTechnicians(
                PageRequest.of(page, size, Sort.by(sortBy))));
    }

    @PatchMapping("/{id}/availability")
    @Operation(summary = "Update availability status (TECHNICIAN only)")
    public ResponseEntity<TechnicianResponse> updateAvailability(
            @PathVariable Long id, @RequestParam AvailabilityStatus status,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        TechnicianResponse tech = service.getTechnicianById(id);
        if (!"ADMIN".equals(role) && userId != null && userId != 0L) {
            if (!"TECHNICIAN".equals(role) || !tech.getUserId().equals(userId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. You do not own this profile.");
            }
        }
        return ResponseEntity.ok(service.updateAvailability(id, status));
    }

    @PatchMapping("/user/{userId}/availability")
    @Operation(summary = "Update availability status by userId (TECHNICIAN only)")
    public ResponseEntity<TechnicianResponse> updateAvailabilityByUserId(
            @PathVariable Long userId, @RequestParam AvailabilityStatus status,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long loggedUserId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        if (!"ADMIN".equals(role) && !"USER".equals(role) && loggedUserId != null && loggedUserId != 0L) {
            if (!"TECHNICIAN".equals(role) || !loggedUserId.equals(userId)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied. You do not own this profile.");
            }
        }
        return ResponseEntity.ok(service.updateAvailabilityByUserId(userId, status));
    }

    @PatchMapping("/{id}/location")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Update GPS location (TECHNICIAN only)")
    public ResponseEntity<TechnicianResponse> updateLocation(
            @PathVariable Long id, @Valid @RequestBody LocationUpdateRequest request,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId = getUserIdFromToken(token);
        String role = getRoleFromToken(token);
        TechnicianResponse tech = service.getTechnicianById(id);
        if (!"ADMIN".equals(role) && userId != null && userId != 0L && !tech.getUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied. You do not own this profile.");
        }
        return ResponseEntity.ok(service.updateLocation(id, request));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Update technician phone and/or skills (partial update)")
    public ResponseEntity<TechnicianResponse> updateProfile(
            @Valid @RequestBody TechnicianProfileUpdateRequest request,
            HttpServletRequest httpRequest) {
        String token = extractToken(httpRequest);
        Long userId  = getUserIdFromToken(token);
        return ResponseEntity.ok(service.updateProfile(userId, request));
    }

    @PatchMapping("/{id}/rating")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Rate a technician after job completion (USER or ADMIN)")
    public ResponseEntity<TechnicianResponse> rateAndComplete(
            @PathVariable Long id, @Valid @RequestBody RatingRequest request) {
        return ResponseEntity.ok(service.updateRatingByUserId(id, request));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find available technicians within radius")
    public ResponseEntity<List<NearbyTechnicianResponse>> findNearby(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radiusKm,
            @RequestParam(required = false) ServiceType serviceType) {
        return ResponseEntity.ok(service.findNearbyAvailable(latitude, longitude, radiusKm, serviceType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete technician profile (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteTechnician(id);
        return ResponseEntity.noContent().build();
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
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
    }
}
