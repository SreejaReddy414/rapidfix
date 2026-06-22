package com.rapidfix.dispatch.service;

import com.rapidfix.dispatch.dto.*;
import com.rapidfix.dispatch.entity.RequestStatus;
import com.rapidfix.dispatch.entity.ServiceType;
import org.springframework.data.domain.Pageable;

public interface DispatchService {
    ServiceRequestResponse createRequest(ServiceRequestCreate request, Long userId, String userEmail);
    ServiceRequestResponse getRequestById(Long id);
    PagedResponse<ServiceRequestResponse> getRequestsByUser(Long userId, Pageable pageable);
    PagedResponse<ServiceRequestResponse> getRequestsByTechnician(Long technicianId, Pageable pageable);
    PagedResponse<ServiceRequestResponse> getRequestsByStatus(RequestStatus status, Pageable pageable);
    PagedResponse<ServiceRequestResponse> getAvailableRequestsByServiceType(ServiceType serviceType, Long technicianId, Pageable pageable);
    ServiceRequestResponse withdrawQuote(Long requestId, Long technicianId);
    ServiceRequestResponse submitQuote(Long requestId, QuoteRequest quote, Long technicianId, String technicianName);
    ServiceRequestResponse approveQuote(Long requestId, Long technicianId);
    ServiceRequestResponse rejectQuote(Long requestId, Long technicianId);
    java.util.List<QuoteResponse> getQuotesForRequest(Long requestId);

    ServiceRequestResponse markInProgress(Long requestId);
    ServiceRequestResponse completeRequest(Long requestId, CompletionRequest completion);
    ServiceRequestResponse cancelRequest(Long requestId);
    ServiceRequestResponse markAsRated(Long requestId);
    void runAutoAssignment();
}