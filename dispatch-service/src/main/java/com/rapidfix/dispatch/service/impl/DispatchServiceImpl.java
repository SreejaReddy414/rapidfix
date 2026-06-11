package com.rapidfix.dispatch.service.impl;

import com.rapidfix.dispatch.dto.*;
import com.rapidfix.dispatch.entity.*;
import com.rapidfix.dispatch.exception.*;
import com.rapidfix.dispatch.mapper.ServiceRequestMapper;
import com.rapidfix.dispatch.repository.*;
import com.rapidfix.dispatch.service.DispatchService;
import com.rapidfix.dispatch.util.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class DispatchServiceImpl implements DispatchService {

    private final ServiceRequestRepository requestRepo;
    private final DispatchLogRepository logRepo;
    private final ServiceRequestMapper mapper;
    private final WebClient technicianWebClient;
    private final MessageService messages;

    @Value("${dispatch.broadcast-timeout-seconds:60}")
    private int broadcastTimeoutSeconds;

    @Value("${dispatch.auto-assign-radius-km:15.0}")
    private double autoAssignRadiusKm;

    @Override @Transactional
    public ServiceRequestResponse createRequest(ServiceRequestCreate req, Long userId, String userEmail) {
        log.info("New service request from userId={} ({}) for {}", userId, userEmail, req.getServiceType());

        ServiceRequest sr = ServiceRequest.builder()
                .userId(userId).userName(userEmail)
                .serviceType(req.getServiceType())
                .description(req.getDescription())
                .userLatitude(req.getUserLatitude())
                .userLongitude(req.getUserLongitude())
                .address(req.getAddress())
                .status(RequestStatus.PENDING)
                .broadcastedAt(LocalDateTime.now())
                .build();

        ServiceRequest saved = requestRepo.save(sr);
        log.info("ServiceRequest created id={}", saved.getId());
        broadcastToNearby(saved);
        return mapper.toResponse(saved);
    }

    @Override @Transactional(readOnly = true)
    public ServiceRequestResponse getRequestById(Long id) {
        return mapper.toResponse(findById(id));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<ServiceRequestResponse> getRequestsByUser(Long userId, Pageable pageable) {
        return toPagedResponse(requestRepo.findByUserId(userId, pageable));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<ServiceRequestResponse> getRequestsByTechnician(Long technicianId, Pageable pageable) {
        return toPagedResponse(requestRepo.findByTechnicianId(technicianId, pageable));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<ServiceRequestResponse> getRequestsByStatus(RequestStatus status, Pageable pageable) {
        return toPagedResponse(requestRepo.findByStatus(status, pageable));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<ServiceRequestResponse> getAvailableRequestsByServiceType(
            ServiceType serviceType, Pageable pageable) {
        log.debug("Fetching PENDING requests for serviceType={}", serviceType);
        Page<ServiceRequest> page = requestRepo.findByStatusAndServiceType(
                RequestStatus.PENDING, serviceType, pageable);
        return toPagedResponse(page);
    }

    @Override @Transactional
    public ServiceRequestResponse submitQuote(Long requestId, QuoteRequest quote,
                                              Long technicianId, String technicianName) {
        log.info("Technician {} submitting quote for request {}", technicianId, requestId);
        ServiceRequest sr = findById(requestId);

        if (sr.getStatus() != RequestStatus.PENDING)
            throw new InvalidStateException(
                    messages.get("error.quote.not.pending", sr.getStatus()));

        double freeRadiusKm = 3.0;
        double ratePerKm = 12.0;

        // Fetch technician location and calculate distance if not already set
        if (sr.getDistanceKm() == null) {
            try {
                NearbyTechnicianDto techInfo = fetchNearbyTechnicians(
                        sr.getUserLatitude(), sr.getUserLongitude(), 200.0, sr.getServiceType().name())
                        .stream()
                        .filter(t -> t.getUserId().equals(technicianId))
                        .findFirst()
                        .orElse(null);

                if (techInfo != null) {
                    sr.setDistanceKm(techInfo.getDistanceKm());
                    log.info("Distance calculated for request {}: {}km", requestId, techInfo.getDistanceKm());
                }
            } catch (Exception e) {
                log.warn("Could not fetch technician distance: {}", e.getMessage());
            }
        }

        double distanceKm = sr.getDistanceKm() != null ? sr.getDistanceKm() : 0.0;
        double travelCharge = Math.max(0, distanceKm - freeRadiusKm) * ratePerKm;
        double total = (quote.getHourlyRate() * quote.getEstimatedHours()) + quote.getApplianceCharge() + travelCharge;

        sr.setTechnicianId(technicianId);
        sr.setTechnicianName(technicianName);
        sr.setHourlyRate(quote.getHourlyRate());
        sr.setEstimatedHours(quote.getEstimatedHours());
        sr.setApplianceCharge(quote.getApplianceCharge());
        sr.setTotalAmount(Math.round(total * 100.0) / 100.0);
        sr.setTravelCharge(travelCharge);
        sr.setQuoteNote(quote.getQuoteNote());
        sr.setStatus(RequestStatus.QUOTED);
        sr.setQuotedAt(LocalDateTime.now());
        sr.setTechnicianPhone(quote.getTechnicianPhone());
        updateTechnicianAvailability(technicianId, "BUSY");
        logAction(requestId, technicianId, "QUOTED",
                String.format("₹%.0f/hr × %.1fhr + ₹%.0f parts + ₹%.0f travel = ₹%.0f",
                        quote.getHourlyRate(), quote.getEstimatedHours(),
                        quote.getApplianceCharge(), travelCharge, total));
        log.info("Quote submitted: ₹{} total for request {} (distance: {}km, travel: ₹{})",
                total, requestId, distanceKm, travelCharge);
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public ServiceRequestResponse approveQuote(Long requestId) {
        log.info("User approving quote for request {}", requestId);
        ServiceRequest sr = findById(requestId);

        if (sr.getStatus() != RequestStatus.QUOTED)
            throw new InvalidStateException(
                    messages.get("error.quote.not.quoted.approve", sr.getStatus()));  // ← CHANGED

        sr.setStatus(RequestStatus.APPROVED);
        sr.setApprovedAt(LocalDateTime.now());
       // sr.setApprovedAt(LocalDateTime.now());

// Calculate ETA from saved distanceKm
        double dist = sr.getDistanceKm() != null ? sr.getDistanceKm() : 2.0;
        long travelMinutes = Math.round((dist / 30.0) * 60); // 30 km/h avg speed
        long etaMinutes = travelMinutes + 5; // +5 min preparation
        sr.setEstimatedArrivalTime(LocalDateTime.now().plusMinutes(etaMinutes));
        log.info("ETA: {}km → {} mins", dist, etaMinutes);
        updateTechnicianAvailability(sr.getTechnicianId(), "BUSY");

        logAction(requestId, sr.getTechnicianId(), "QUOTE_APPROVED",
                "User approved ₹" + sr.getTotalAmount());
        log.info("Quote approved for request {}. Technician {} now visiting.", requestId, sr.getTechnicianId());
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public ServiceRequestResponse rejectQuote(Long requestId) {
        log.info("User rejecting quote for request {}", requestId);
        ServiceRequest sr = findById(requestId);

        if (sr.getStatus() != RequestStatus.QUOTED)
            throw new InvalidStateException(
                    messages.get("error.quote.not.quoted.reject", sr.getStatus()));  // ← CHANGED

        Long rejectedTechnicianId = sr.getTechnicianId();

        sr.setStatus(RequestStatus.PENDING);
        sr.setTechnicianId(null);
        sr.setTechnicianName(null);
        sr.setHourlyRate(null);
        sr.setEstimatedHours(null);
        sr.setApplianceCharge(null);
        sr.setTotalAmount(null);
        sr.setQuoteNote(null);
        sr.setQuotedAt(null);
        sr.setApprovedAt(null);
        sr.setBroadcastedAt(LocalDateTime.now());
        updateTechnicianAvailability(rejectedTechnicianId, "AVAILABLE");
        logAction(requestId, rejectedTechnicianId, "QUOTE_REJECTED", "User rejected quote");
        log.info("Quote rejected for request {}. Back to PENDING.", requestId);
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public ServiceRequestResponse markInProgress(Long requestId) {
        ServiceRequest sr = findById(requestId);
        if (sr.getStatus() != RequestStatus.APPROVED)
            throw new InvalidStateException(
                    messages.get("error.inprogress.not.approved", sr.getStatus()));  // ← CHANGED
        sr.setStatus(RequestStatus.IN_PROGRESS);
        log.info("Request {} IN_PROGRESS — technician on site", requestId);
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public ServiceRequestResponse completeRequest(Long requestId, CompletionRequest completion) {
        ServiceRequest sr = findById(requestId);
        if (sr.getStatus() != RequestStatus.IN_PROGRESS)
            throw new InvalidStateException(
                    messages.get("error.complete.not.inprogress", sr.getStatus()));  // ← CHANGED

        double travelCharge = sr.getTravelCharge() != null ? sr.getTravelCharge() : 0.0;
        double finalAmt = (sr.getHourlyRate() * completion.getActualHours())
                + completion.getActualApplianceCharge()
                + travelCharge; // ← ADD THIS

        sr.setActualHours(completion.getActualHours());
        sr.setActualApplianceCharge(completion.getActualApplianceCharge());
        sr.setFinalAmount(Math.round(finalAmt * 100.0) / 100.0);
        sr.setCompletionNote(completion.getCompletionNote());
        sr.setStatus(RequestStatus.COMPLETED);
        sr.setCompletedAt(LocalDateTime.now());

        updateTechnicianAvailability(sr.getTechnicianId(), "AVAILABLE");

        logAction(requestId, sr.getTechnicianId(), "COMPLETED",
                String.format("Actual: Rs%.0f/hr x %.1fhr + Rs%.0f parts = Rs%.0f final",
                        sr.getHourlyRate(), completion.getActualHours(),
                        completion.getActualApplianceCharge(), finalAmt));

        log.info("Request {} COMPLETED. Quoted: Rs{} | Final: Rs{}",
                requestId, sr.getTotalAmount(), finalAmt);
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public ServiceRequestResponse cancelRequest(Long requestId) {
        ServiceRequest sr = findById(requestId);
        if (sr.getStatus() == RequestStatus.COMPLETED || sr.getStatus() == RequestStatus.CANCELLED)
            throw new InvalidStateException(
                    messages.get("error.cancel.not.allowed", sr.getStatus()));  // ← CHANGED
        sr.setStatus(RequestStatus.CANCELLED);
        if (sr.getTechnicianId() != null)
            updateTechnicianAvailability(sr.getTechnicianId(), "AVAILABLE");
        log.info("Request {} CANCELLED", requestId);
        return mapper.toResponse(requestRepo.save(sr));
    }

    @Override @Transactional
    public void runAutoAssignment() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(broadcastTimeoutSeconds);
        List<ServiceRequest> stale = requestRepo.findPendingRequestsOlderThan(cutoff);
        if (stale.isEmpty()) return;
        log.info("Auto-assignment: {} stale PENDING requests", stale.size());
        stale.forEach(sr -> {
            try { autoAssign(sr); }
            catch (Exception e) {
                log.error("Auto-assign failed for request {}: {}", sr.getId(), e.getMessage()); }
        });
    }

    private void autoAssign(ServiceRequest sr) {
        double freeRadiusKm = 3.0;
        double ratePerKm    = 12.0;
        List<NearbyTechnicianDto> nearby = fetchNearbyTechnicians(
                sr.getUserLatitude(), sr.getUserLongitude(),
                autoAssignRadiusKm, sr.getServiceType().name());

        if (nearby.isEmpty()) {
            log.warn("No technicians available for request {}. Re-queuing.", sr.getId());
            sr.setBroadcastAttempts(sr.getBroadcastAttempts() + 1);
            sr.setBroadcastedAt(LocalDateTime.now());
            requestRepo.save(sr);
            return;
        }

        NearbyTechnicianDto best = nearby.stream()
                .max(Comparator.comparingDouble(t ->
                        (t.getRating() * 0.6) + ((10.0 - Math.min(t.getDistanceKm(), 10.0)) * 0.4)))
                .orElseThrow();

        double defaultRate  = 300.0;
        double defaultHours = 1.0;
        double travelCharge = Math.max(0, best.getDistanceKm() - freeRadiusKm) * ratePerKm;
        travelCharge        = Math.round(travelCharge * 100.0) / 100.0;
        double total        = (defaultRate * defaultHours) + travelCharge;

        sr.setStatus(RequestStatus.QUOTED);
        sr.setTechnicianId(best.getUserId());
        sr.setTechnicianName(best.getName());
        sr.setHourlyRate(defaultRate);
        sr.setTravelCharge(travelCharge);
       // sr.setTravelCharge(travelCharge);
        sr.setDistanceKm(best.getDistanceKm()); // ← ADD THIS
        sr.setEstimatedHours(defaultHours);
        sr.setApplianceCharge(0.0);
        sr.setTotalAmount(total);
        sr.setQuoteNote("Auto-assigned the best technician by system. Technician will assess and update quote on arrival.");
        sr.setQuotedAt(LocalDateTime.now());
        sr.setBroadcastAttempts(sr.getBroadcastAttempts() + 1);
        requestRepo.save(sr);
        updateTechnicianAvailability(best.getUserId(), "BUSY");
        logAction(sr.getId(), best.getId(), "AUTO_ASSIGNED",
                String.format("distance=%.2fkm rating=%.1f — default quote ₹%.0f",
                        best.getDistanceKm(), best.getRating(), total));
        log.info("Request {} auto-assigned to technician {} with default quote",
                sr.getId(), best.getId());
    }

    private void broadcastToNearby(ServiceRequest sr) {
        try {
            List<NearbyTechnicianDto> nearby = fetchNearbyTechnicians(
                    sr.getUserLatitude(), sr.getUserLongitude(),
                    autoAssignRadiusKm, sr.getServiceType().name());
            log.info("Broadcasted request {} to {} technicians", sr.getId(), nearby.size());
            nearby.forEach(t -> logAction(sr.getId(), t.getId(), "OFFERED",
                    String.format("%.2fkm away", t.getDistanceKm())));
        } catch (Exception e) {
            log.warn("Broadcast failed for request {}: {}", sr.getId(), e.getMessage());
        }
    }

    private List<NearbyTechnicianDto> fetchNearbyTechnicians(double lat, double lon,
                                                             double radius, String serviceType) {
        try {
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
        } catch (Exception e) {
            log.warn("Failed to fetch nearby technicians: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override @Transactional
    public ServiceRequestResponse markAsRated(Long requestId) {
        ServiceRequest sr = findById(requestId);
        sr.setRated(true);
        return mapper.toResponse(requestRepo.save(sr));
    }

    private void updateTechnicianAvailability(Long userId, String status) {
        try {
            technicianWebClient.patch()
                    .uri("/api/technicians/user/{userId}/availability?status={status}", userId, status)
                    .retrieve().toBodilessEntity().block();
        } catch (Exception e) {
            log.warn("Failed to update technician {} to {}: {}", userId, status, e.getMessage());
        }
    }

    private void logAction(Long requestId, Long technicianId, String action, String notes) {
        logRepo.save(DispatchLog.builder()
                .requestId(requestId)
                .technicianId(technicianId)
                .action(action)
                .notes(notes)
                .build());
    }

    private ServiceRequest findById(Long id) {
        return requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.request.not.found", id)));  // ← CHANGED
    }

    private PagedResponse<ServiceRequestResponse> toPagedResponse(Page<ServiceRequest> page) {
        return PagedResponse.<ServiceRequestResponse>builder()
                .content(page.getContent().stream().map(mapper::toResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
    @Override @Transactional
    public ServiceRequestResponse withdrawQuote(Long requestId, Long technicianId) {
        log.info("Technician {} withdrawing quote for request {}", technicianId, requestId);
        ServiceRequest sr = findById(requestId);

        if (sr.getStatus() != RequestStatus.QUOTED)
            throw new InvalidStateException("Quote already acted upon");

        if (!sr.getTechnicianId().equals(technicianId))
            throw new InvalidStateException("This is not your quote");

        sr.setStatus(RequestStatus.PENDING);
        sr.setTechnicianId(null);
        sr.setTechnicianName(null);
        sr.setHourlyRate(null);
        sr.setEstimatedHours(null);
        sr.setApplianceCharge(null);
        sr.setTravelCharge(null);
        sr.setTotalAmount(null);
        sr.setQuoteNote(null);
        sr.setQuotedAt(null);
        sr.setTechnicianPhone(null);
        sr.setBroadcastedAt(LocalDateTime.now()); // ← makes it visible to others again

        updateTechnicianAvailability(technicianId, "AVAILABLE");
        logAction(requestId, technicianId, "QUOTE_WITHDRAWN", "Technician withdrew quote after timeout");

        log.info("Quote withdrawn for request {}. Back to PENDING.", requestId);
        return mapper.toResponse(requestRepo.save(sr));
    }
}