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
        String email = jwtUtil.extractEmail(token);
        String name  = jwtUtil.extractName(token);
        Long userId  = jwtUtil.extractUserId(token);

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
    public ResponseEntity<TechnicianResponse> getByUserId(@PathVariable Long userId) {
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
            @PathVariable Long id, @RequestParam AvailabilityStatus status) {
        return ResponseEntity.ok(service.updateAvailability(id, status));
    }
    @PatchMapping("/user/{userId}/availability")
    public ResponseEntity<TechnicianResponse> updateAvailabilityByUserId(
            @PathVariable Long userId, @RequestParam AvailabilityStatus status) {
        return ResponseEntity.ok(service.updateAvailabilityByUserId(userId, status));
    }

    @PatchMapping("/{id}/location")
    @PreAuthorize("hasRole('TECHNICIAN')")
    @Operation(summary = "Update GPS location (TECHNICIAN only)")
    public ResponseEntity<TechnicianResponse> updateLocation(
            @PathVariable Long id, @Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(service.updateLocation(id, request));
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

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer "))
            return header.substring(7);
        throw new RuntimeException("Missing Authorization header");
    }
}
