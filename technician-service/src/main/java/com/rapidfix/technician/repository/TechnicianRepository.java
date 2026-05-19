package com.rapidfix.technician.repository;
import com.rapidfix.technician.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByUserId(Long userId);
    Optional<Technician> findByEmail(String email);
    boolean existsByUserId(Long userId);

    @Query("SELECT t FROM Technician t WHERE t.availabilityStatus = :status")
    List<Technician> findByAvailabilityStatus(@Param("status") AvailabilityStatus status);

    @Query("SELECT t FROM Technician t JOIN t.serviceTypes s WHERE s = :serviceType AND t.availabilityStatus = 'AVAILABLE'")
    List<Technician> findAvailableByServiceType(@Param("serviceType") ServiceType serviceType);
}
