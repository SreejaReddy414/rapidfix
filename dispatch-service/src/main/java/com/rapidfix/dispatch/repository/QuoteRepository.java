package com.rapidfix.dispatch.repository;

import com.rapidfix.dispatch.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByRequestId(Long requestId);
    Optional<Quote> findByRequestIdAndTechnicianId(Long requestId, Long technicianId);
}
