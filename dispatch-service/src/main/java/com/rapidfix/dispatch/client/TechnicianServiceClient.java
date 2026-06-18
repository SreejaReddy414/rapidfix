package com.rapidfix.dispatch.client;

import com.rapidfix.dispatch.dto.NearbyTechnicianDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TechnicianServiceClient {

    private final WebClient technicianWebClient;

    @CircuitBreaker(name = "technicianService", fallbackMethod = "fetchNearbyTechniciansFallback")
    public List<NearbyTechnicianDto> fetchNearbyTechnicians(double lat, double lon, double radius, String serviceType) {
        return technicianWebClient.get()
                .uri(u -> u.path("/api/technicians/nearby")
                        .queryParam("latitude", lat)
                        .queryParam("longitude", lon)
                        .queryParam("radiusKm", radius)
                        .queryParam("serviceType", serviceType)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<NearbyTechnicianDto>>() {})
                .block();
    }

    public List<NearbyTechnicianDto> fetchNearbyTechniciansFallback(double lat, double lon, double radius, String serviceType, Throwable t) {
        log.warn("Circuit Breaker triggered for fetchNearbyTechnicians. Fallback active. Error: {}", t.getMessage());
        return Collections.emptyList();
    }

    @CircuitBreaker(name = "technicianService", fallbackMethod = "updateTechnicianAvailabilityFallback")
    public void updateTechnicianAvailability(Long userId, String status) {
        technicianWebClient.patch()
                .uri("/api/technicians/user/{userId}/availability?status={status}", userId, status)
                .retrieve().toBodilessEntity().block();
    }

    public void updateTechnicianAvailabilityFallback(Long userId, String status, Throwable t) {
        log.warn("Circuit Breaker triggered for updateTechnicianAvailability. Fallback active. Failed to update technician {} to {}. Error: {}", userId, status, t.getMessage());
    }

    @CircuitBreaker(name = "technicianService", fallbackMethod = "fetchTechnicianEmailFallback")
    public String fetchTechnicianEmail(Long userId) {
        Map<String, Object> res = technicianWebClient.get()
                .uri("/api/technicians/user/{userId}", userId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        if (res != null && res.containsKey("email")) {
            return (String) res.get("email");
        }
        return null;
    }

    public String fetchTechnicianEmailFallback(Long userId, Throwable t) {
        log.warn("Circuit Breaker triggered for fetchTechnicianEmail. Fallback active. Error: {}", t.getMessage());
        return null;
    }
}
