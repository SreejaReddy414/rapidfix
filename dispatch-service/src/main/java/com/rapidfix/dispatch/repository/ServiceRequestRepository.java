package com.rapidfix.dispatch.repository;
import com.rapidfix.dispatch.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    Page<ServiceRequest> findByUserId(Long userId, Pageable pageable);
    Page<ServiceRequest> findByStatus(RequestStatus status, Pageable pageable);
    Page<ServiceRequest> findByTechnicianId(Long technicianId, Pageable pageable);
    @Query("SELECT r FROM ServiceRequest r WHERE r.status = 'PENDING' AND r.broadcastedAt < :cutoff")
    List<ServiceRequest> findPendingRequestsOlderThan(@Param("cutoff") LocalDateTime cutoff);
    @Query("SELECT COUNT(r) FROM ServiceRequest r WHERE r.userId = :userId AND r.status = 'PENDING'")
    long countPendingByUser(@Param("userId") Long userId);
    Page<ServiceRequest> findByStatusAndServiceType(
            RequestStatus status, ServiceType serviceType, Pageable pageable);

    @Query("SELECT r FROM ServiceRequest r WHERE (r.status = com.rapidfix.dispatch.entity.RequestStatus.PENDING OR r.status = com.rapidfix.dispatch.entity.RequestStatus.QUOTED) AND r.serviceType = :serviceType AND r.id NOT IN (SELECT q.requestId FROM Quote q WHERE q.technicianId = :technicianId)")
    Page<ServiceRequest> findAvailableRequestsForTechnician(
            @Param("serviceType") ServiceType serviceType,
            @Param("technicianId") Long technicianId,
            Pageable pageable);

    // Payment: look up request by Razorpay order ID (for webhook processing)
    Optional<ServiceRequest> findByRazorpayOrderId(String razorpayOrderId);
}