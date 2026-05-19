package com.rapidfix.technician.service.impl;

import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.*;
import com.rapidfix.technician.exception.ResourceNotFoundException;
import com.rapidfix.technician.mapper.TechnicianMapper;
import com.rapidfix.technician.repository.TechnicianRepository;
import com.rapidfix.technician.service.TechnicianService;
import com.rapidfix.technician.util.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class TechnicianServiceImpl implements TechnicianService {

    private final TechnicianRepository repo;
    private final TechnicianMapper mapper;
    private final MessageService messages;

    @Override @Transactional
    public TechnicianResponse registerTechnician(TechnicianRequest req, Long userId, String name, String email) {
        log.info("Registering technician profile for userId={} name={}", userId, name);
        if (repo.existsByUserId(userId))
            throw new RuntimeException(
                    messages.get("error.technician.profile.exists"));

        Technician t = Technician.builder()
                .userId(userId).name(name).email(email).phone(req.getPhone())
                .serviceTypes(req.getServiceTypes())
                .latitude(req.getLatitude()).longitude(req.getLongitude())
                .availabilityStatus(AvailabilityStatus.OFFLINE)
                .build();

        Technician saved = repo.save(t);
        log.info("Technician profile created id={}", saved.getId());
        return mapper.toResponse(saved);
    }

    @Override @Transactional(readOnly = true)
    public TechnicianResponse getTechnicianById(Long id) {
        return mapper.toResponse(findById(id));
    }

    @Override @Transactional(readOnly = true)
    public TechnicianResponse getTechnicianByUserId(Long userId) {
        return mapper.toResponse(repo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.technician.not.found.userid", userId))));
    }

    @Override @Transactional(readOnly = true)
    public PagedResponse<TechnicianResponse> getAllTechnicians(Pageable pageable) {
        Page<Technician> page = repo.findAll(pageable);
        return PagedResponse.<TechnicianResponse>builder()
                .content(page.getContent().stream().map(mapper::toResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }

    @Override @Transactional
    public TechnicianResponse updateAvailability(Long id, AvailabilityStatus status) {
        log.info("Updating availability id={} -> {}", id, status);
        Technician t = findById(id);
        t.setAvailabilityStatus(status);
        return mapper.toResponse(repo.save(t));
    }

    @Override @Transactional
    public TechnicianResponse updateLocation(Long id, LocationUpdateRequest req) {
        log.debug("Updating location id={}", id);
        Technician t = findById(id);
        t.setLatitude(req.getLatitude());
        t.setLongitude(req.getLongitude());
        return mapper.toResponse(repo.save(t));
    }

    @Override @Transactional
    public TechnicianResponse updateRating(Long id, RatingRequest req) {
        log.info("Rating technician id={} with {}", id, req.getRating());
        Technician t = findById(id);
        double newRating = ((t.getRating() * t.getTotalRatings()) + req.getRating()) / (t.getTotalRatings() + 1);
        t.setRating(Math.round(newRating * 10.0) / 10.0);
        t.setTotalRatings(t.getTotalRatings() + 1);
        t.setCompletedJobs(t.getCompletedJobs() + 1);
        return mapper.toResponse(repo.save(t));
    }

    @Override @Transactional
    public TechnicianResponse updateRatingByUserId(Long userId, RatingRequest req) {
        log.info("Rating technician by userId={} with {}", userId, req.getRating());
        Technician t = repo.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.technician.not.found.userid", userId)));  // ← CHANGED
        double newRating = ((t.getRating() * t.getTotalRatings()) + req.getRating()) / (t.getTotalRatings() + 1);
        t.setRating(Math.round(newRating * 10.0) / 10.0);
        t.setTotalRatings(t.getTotalRatings() + 1);
        t.setCompletedJobs(t.getCompletedJobs() + 1);
        return mapper.toResponse(repo.save(t));
    }

    @Override @Transactional(readOnly = true)
    public List<NearbyTechnicianResponse> findNearbyAvailable(Double lat, Double lon,
                                                              Double radiusKm, ServiceType serviceType) {
        log.debug("Finding nearby technicians lat={} lon={} radius={}km service={}", lat, lon, radiusKm, serviceType);
        List<Technician> candidates = serviceType != null
                ? repo.findAvailableByServiceType(serviceType)
                : repo.findByAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        return candidates.stream()
                .filter(t -> t.getLatitude() != null && t.getLongitude() != null)
                .map(t -> new Object[]{t, haversineKm(lat, lon, t.getLatitude(), t.getLongitude())})
                .filter(arr -> (double) arr[1] <= radiusKm)
                .sorted(Comparator.comparingDouble(arr -> (double) ((Object[]) arr)[1]))
                .map(arr -> mapper.toNearbyResponse((Technician) arr[0], (double) arr[1]))
                .collect(Collectors.toList());
    }

    @Override @Transactional
    public void deleteTechnician(Long id) {
        if (!repo.existsById(id))
            throw new ResourceNotFoundException(
                    messages.get("error.technician.not.found", id));
        repo.deleteById(id);
    }

    private Technician findById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messages.get("error.technician.not.found", id)));
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}