package com.rapidfix.technician.service;
import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.*;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface TechnicianService {
    TechnicianResponse registerTechnician(TechnicianRequest request, Long userId, String name, String email);
    TechnicianResponse getTechnicianById(Long id);
    TechnicianResponse getTechnicianByUserId(Long userId);
    PagedResponse<TechnicianResponse> getAllTechnicians(Pageable pageable);
    TechnicianResponse updateAvailability(Long id, AvailabilityStatus status);
    TechnicianResponse updateLocation(Long id, LocationUpdateRequest request);
    TechnicianResponse updateRating(Long id, RatingRequest request);
    TechnicianResponse updateRatingByUserId(Long userId, RatingRequest request);  // ← ADD THIS LINE
    List<NearbyTechnicianResponse> findNearbyAvailable(Double lat, Double lon, Double radiusKm, ServiceType serviceType);
    void deleteTechnician(Long id);
}