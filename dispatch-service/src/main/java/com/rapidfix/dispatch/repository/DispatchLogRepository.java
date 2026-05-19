package com.rapidfix.dispatch.repository;
import com.rapidfix.dispatch.entity.DispatchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DispatchLogRepository extends JpaRepository<DispatchLog, Long> {
    List<DispatchLog> findByRequestIdOrderByCreatedAtDesc(Long requestId);
    List<DispatchLog> findByTechnicianId(Long technicianId);
}
