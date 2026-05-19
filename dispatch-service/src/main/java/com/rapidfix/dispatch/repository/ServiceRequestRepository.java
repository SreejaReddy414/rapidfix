package com.rapidfix.dispatch.repository;
import com.rapidfix.dispatch.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

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
}