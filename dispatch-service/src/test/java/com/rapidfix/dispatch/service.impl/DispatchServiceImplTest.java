package com.rapidfix.dispatch.service.impl;

import com.rapidfix.dispatch.dto.*;
import com.rapidfix.dispatch.entity.*;
import com.rapidfix.dispatch.exception.*;
import com.rapidfix.dispatch.mapper.ServiceRequestMapper;
import com.rapidfix.dispatch.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DispatchServiceImpl Tests")
class DispatchServiceImplTest {

    @Mock private ServiceRequestRepository requestRepo;
    @Mock private DispatchLogRepository logRepo;
    @Mock private ServiceRequestMapper mapper;
    @Mock private WebClient technicianWebClient;

    // WebClient chain mocks
    @Mock private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock private WebClient.ResponseSpec responseSpec;
    @Mock private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock private WebClient.RequestBodySpec requestBodySpec;

    @InjectMocks private DispatchServiceImpl service;

    // ─── Test data ────────────────────────────────────────────
    private ServiceRequest pendingRequest;
    private ServiceRequest quotedRequest;
    private ServiceRequest approvedRequest;
    private ServiceRequest inProgressRequest;
    private ServiceRequestCreate createDto;
    private QuoteRequest quoteRequest;
    private CompletionRequest completionRequest;
    private ServiceRequestResponse requestResponse;

    @BeforeEach
    void setUp() {
        pendingRequest = ServiceRequest.builder()
                .id(1L).userId(10L).userName("sreeja@gmail.com")
                .serviceType(ServiceType.ELECTRICIAN)
                .description("Fan not working properly")
                .userLatitude(17.385).userLongitude(78.486)
                .address("Siddipet, Telangana")
                .status(RequestStatus.PENDING)
                .broadcastedAt(LocalDateTime.now())
                .broadcastAttempts(0).rated(false)
                .build();

        quotedRequest = ServiceRequest.builder()
                .id(1L).userId(10L).userName("sreeja@gmail.com")
                .serviceType(ServiceType.ELECTRICIAN)
                .description("Fan not working properly")
                .userLatitude(17.385).userLongitude(78.486)
                .address("Siddipet, Telangana")
                .status(RequestStatus.QUOTED)
                .technicianId(20L).technicianName("Dilip")
                .hourlyRate(100.0).estimatedHours(2.0)
                .applianceCharge(200.0).totalAmount(400.0)
                .broadcastAttempts(0).rated(false)
                .build();

        approvedRequest = ServiceRequest.builder()
                .id(1L).status(RequestStatus.APPROVED)
                .technicianId(20L).technicianName("Dilip")
                .hourlyRate(100.0).estimatedHours(2.0)
                .applianceCharge(200.0).totalAmount(400.0)
                .rated(false).broadcastAttempts(0)
                .build();

        inProgressRequest = ServiceRequest.builder()
                .id(1L).status(RequestStatus.IN_PROGRESS)
                .technicianId(20L).technicianName("Dilip")
                .hourlyRate(100.0).estimatedHours(2.0)
                .applianceCharge(200.0).totalAmount(400.0)
                .rated(false).broadcastAttempts(0)
                .build();

        createDto = ServiceRequestCreate.builder()
                .serviceType(ServiceType.ELECTRICIAN)
                .description("Fan not working properly")
                .userLatitude(17.385).userLongitude(78.486)
                .address("Siddipet, Telangana")
                .build();

        quoteRequest = QuoteRequest.builder()
                .hourlyRate(100.0).estimatedHours(2.0)
                .applianceCharge(200.0).travelCharge(0.0)
                .quoteNote("Likely capacitor issue")
                .build();

        completionRequest = CompletionRequest.builder()
                .actualHours(2.5).actualApplianceCharge(250.0)
                .completionNote("Replaced capacitor")
                .build();

        requestResponse = ServiceRequestResponse.builder()
                .id(1L).status(RequestStatus.PENDING)
                .build();
    }

    // ══════════════════════════════════════════════════════════
    // CREATE REQUEST TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("createRequest()")
    class CreateRequestTests {

        @Test
        @DisplayName("Should create request with PENDING status")
        void createRequest_success_pendingStatus() {
            when(requestRepo.save(any(ServiceRequest.class))).thenReturn(pendingRequest);
            when(mapper.toResponse(pendingRequest)).thenReturn(requestResponse);
            when(technicianWebClient.get()).thenReturn(requestHeadersUriSpec);
            when(requestHeadersUriSpec.uri(any(java.util.function.Function.class)))
                    .thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(any(org.springframework.core.ParameterizedTypeReference.class)))
                    .thenReturn(Mono.just(List.of()));

            ServiceRequestResponse result = service.createRequest(createDto, 10L, "sreeja@gmail.com");

            assertThat(result).isNotNull();
            verify(requestRepo).save(argThat(sr ->
                    sr.getStatus() == RequestStatus.PENDING &&
                            sr.getUserId().equals(10L) &&
                            sr.getUserName().equals("sreeja@gmail.com")));
        }

        @Test
        @DisplayName("Should set broadcastedAt on creation")
        void createRequest_setsBroadcastedAt() {
            when(requestRepo.save(any(ServiceRequest.class))).thenReturn(pendingRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(technicianWebClient.get()).thenReturn(requestHeadersUriSpec);
            when(requestHeadersUriSpec.uri(any(java.util.function.Function.class)))
                    .thenReturn(requestHeadersSpec);
            when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.bodyToMono(any(org.springframework.core.ParameterizedTypeReference.class)))
                    .thenReturn(Mono.just(List.of()));

            service.createRequest(createDto, 10L, "sreeja@gmail.com");

            verify(requestRepo).save(argThat(sr -> sr.getBroadcastedAt() != null));
        }
    }

    // ══════════════════════════════════════════════════════════
    // GET REQUEST TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getRequestById()")
    class GetRequestTests {

        @Test
        @DisplayName("Should return request when found")
        void getById_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            when(mapper.toResponse(pendingRequest)).thenReturn(requestResponse);

            ServiceRequestResponse result = service.getRequestById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when not found")
        void getById_notFound() {
            when(requestRepo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getRequestById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Service request not found: 99");
        }
    }

    // ══════════════════════════════════════════════════════════
    // SUBMIT QUOTE TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("submitQuote()")
    class SubmitQuoteTests {

        @Test
        @DisplayName("Should submit quote and move to QUOTED status")
        void submitQuote_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            when(requestRepo.save(any())).thenReturn(quotedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);

            service.submitQuote(1L, quoteRequest, 20L, "Dilip");

            verify(requestRepo).save(argThat(sr ->
                    sr.getStatus() == RequestStatus.QUOTED &&
                            sr.getTechnicianId().equals(20L) &&
                            sr.getTechnicianName().equals("Dilip") &&
                            sr.getHourlyRate().equals(100.0)));
        }

        @Test
        @DisplayName("Should calculate total correctly — hourlyRate × hours + applianceCharge")
        void submitQuote_totalCalculation() {
            // 100 × 2 + 200 = 400
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            when(requestRepo.save(any())).thenReturn(quotedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);

            service.submitQuote(1L, quoteRequest, 20L, "Dilip");

            verify(requestRepo).save(argThat(sr -> sr.getTotalAmount().equals(400.0)));
        }

        @Test
        @DisplayName("Should include travelCharge in total when provided")
        void submitQuote_withTravelCharge() {
            quoteRequest.setTravelCharge(48.0);
            // 100 × 2 + 200 + 48 = 448
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            when(requestRepo.save(any())).thenReturn(quotedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);

            service.submitQuote(1L, quoteRequest, 20L, "Dilip");

            verify(requestRepo).save(argThat(sr -> sr.getTotalAmount().equals(448.0)));
        }

        @Test
        @DisplayName("Should throw InvalidStateException when request is not PENDING")
        void submitQuote_notPending_throwsException() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));

            assertThatThrownBy(() -> service.submitQuote(1L, quoteRequest, 20L, "Dilip"))
                    .isInstanceOf(InvalidStateException.class)
                    .hasMessageContaining("PENDING");
        }
    }

    // ══════════════════════════════════════════════════════════
    // APPROVE QUOTE TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("approveQuote()")
    class ApproveQuoteTests {

        @Test
        @DisplayName("Should approve quote and move to APPROVED status")
        void approveQuote_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));
            when(requestRepo.save(any())).thenReturn(approvedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);
            mockAvailabilityUpdate();

            service.approveQuote(1L);

            verify(requestRepo).save(argThat(sr ->
                    sr.getStatus() == RequestStatus.APPROVED &&
                            sr.getApprovedAt() != null));
        }

        @Test
        @DisplayName("Should call technician-service to set BUSY on approval")
        void approveQuote_setsTechnicianBusy() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));
            when(requestRepo.save(any())).thenReturn(approvedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);
            mockAvailabilityUpdate();

            service.approveQuote(1L);

            verify(technicianWebClient).patch();
        }

        @Test
        @DisplayName("Should throw InvalidStateException when request is not QUOTED")
        void approveQuote_notQuoted_throwsException() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));

            assertThatThrownBy(() -> service.approveQuote(1L))
                    .isInstanceOf(InvalidStateException.class)
                    .hasMessageContaining("No pending quote");
        }
    }

    // ══════════════════════════════════════════════════════════
    // REJECT QUOTE TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("rejectQuote()")
    class RejectQuoteTests {

        @Test
        @DisplayName("Should reject quote and reset to PENDING")
        void rejectQuote_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));
            when(requestRepo.save(any())).thenReturn(pendingRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);

            service.rejectQuote(1L);

            verify(requestRepo).save(argThat(sr -> {
                assertThat(sr.getStatus()).isEqualTo(RequestStatus.PENDING);
                assertThat(sr.getTechnicianId()).isNull();
                assertThat(sr.getTechnicianName()).isNull();
                assertThat(sr.getHourlyRate()).isNull();
                assertThat(sr.getTotalAmount()).isNull();
                return true;
            }));
        }

        @Test
        @DisplayName("Should throw InvalidStateException when request is not QUOTED")
        void rejectQuote_notQuoted_throwsException() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));

            assertThatThrownBy(() -> service.rejectQuote(1L))
                    .isInstanceOf(InvalidStateException.class);
        }
    }

    // ══════════════════════════════════════════════════════════
    // MARK IN PROGRESS TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("markInProgress()")
    class InProgressTests {

        @Test
        @DisplayName("Should move to IN_PROGRESS when APPROVED")
        void markInProgress_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(approvedRequest));
            when(requestRepo.save(any())).thenReturn(inProgressRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);

            service.markInProgress(1L);

            verify(requestRepo).save(argThat(sr -> sr.getStatus() == RequestStatus.IN_PROGRESS));
        }

        @Test
        @DisplayName("Should throw InvalidStateException when not APPROVED")
        void markInProgress_notApproved_throwsException() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));

            assertThatThrownBy(() -> service.markInProgress(1L))
                    .isInstanceOf(InvalidStateException.class)
                    .hasMessageContaining("approves the quote");
        }
    }

    // ══════════════════════════════════════════════════════════
    // COMPLETE REQUEST TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("completeRequest()")
    class CompleteRequestTests {

        @Test
        @DisplayName("Should complete request and calculate final amount")
        void complete_success_finalAmountCalculated() {
            // hourlyRate=100, actualHours=2.5, actualParts=250 → final=500
            when(requestRepo.findById(1L)).thenReturn(Optional.of(inProgressRequest));
            when(requestRepo.save(any())).thenReturn(inProgressRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);
            mockAvailabilityUpdate();

            service.completeRequest(1L, completionRequest);

            verify(requestRepo).save(argThat(sr -> {
                assertThat(sr.getStatus()).isEqualTo(RequestStatus.COMPLETED);
                assertThat(sr.getFinalAmount()).isEqualTo(500.0); // 100×2.5 + 250
                assertThat(sr.getActualHours()).isEqualTo(2.5);
                assertThat(sr.getActualApplianceCharge()).isEqualTo(250.0);
                assertThat(sr.getCompletedAt()).isNotNull();
                return true;
            }));
        }

        @Test
        @DisplayName("Should release technician to AVAILABLE on completion")
        void complete_releasesTechnician() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(inProgressRequest));
            when(requestRepo.save(any())).thenReturn(inProgressRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            when(logRepo.save(any())).thenReturn(null);
            mockAvailabilityUpdate();

            service.completeRequest(1L, completionRequest);

            verify(technicianWebClient).patch();
        }

        @Test
        @DisplayName("Should throw InvalidStateException when not IN_PROGRESS")
        void complete_notInProgress_throwsException() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(approvedRequest));

            assertThatThrownBy(() -> service.completeRequest(1L, completionRequest))
                    .isInstanceOf(InvalidStateException.class)
                    .hasMessageContaining("IN_PROGRESS");
        }
    }

    // ══════════════════════════════════════════════════════════
    // CANCEL REQUEST TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("cancelRequest()")
    class CancelRequestTests {

        @Test
        @DisplayName("Should cancel PENDING request")
        void cancel_pending_success() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            when(requestRepo.save(any())).thenReturn(pendingRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);

            service.cancelRequest(1L);

            verify(requestRepo).save(argThat(sr -> sr.getStatus() == RequestStatus.CANCELLED));
        }

        @Test
        @DisplayName("Should release technician when cancelling QUOTED request")
        void cancel_quoted_releasesTechnician() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));
            when(requestRepo.save(any())).thenReturn(quotedRequest);
            when(mapper.toResponse(any())).thenReturn(requestResponse);
            mockAvailabilityUpdate();

            service.cancelRequest(1L);

            verify(technicianWebClient).patch();
        }

        @Test
        @DisplayName("Should throw InvalidStateException when already COMPLETED")
        void cancel_completed_throwsException() {
            ServiceRequest completed = ServiceRequest.builder()
                    .id(1L).status(RequestStatus.COMPLETED).rated(false).broadcastAttempts(0).build();
            when(requestRepo.findById(1L)).thenReturn(Optional.of(completed));

            assertThatThrownBy(() -> service.cancelRequest(1L))
                    .isInstanceOf(InvalidStateException.class)
                    .hasMessageContaining("COMPLETED");
        }

        @Test
        @DisplayName("Should throw InvalidStateException when already CANCELLED")
        void cancel_alreadyCancelled_throwsException() {
            ServiceRequest cancelled = ServiceRequest.builder()
                    .id(1L).status(RequestStatus.CANCELLED).rated(false).broadcastAttempts(0).build();
            when(requestRepo.findById(1L)).thenReturn(Optional.of(cancelled));

            assertThatThrownBy(() -> service.cancelRequest(1L))
                    .isInstanceOf(InvalidStateException.class);
        }
    }

    // ══════════════════════════════════════════════════════════
    // MARK AS RATED TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("markAsRated()")
    class MarkAsRatedTests {

        @Test
        @DisplayName("Should set rated=true")
        void markAsRated_success() {
            ServiceRequest completed = ServiceRequest.builder()
                    .id(1L).status(RequestStatus.COMPLETED)
                    .rated(false).broadcastAttempts(0).build();

            when(requestRepo.findById(1L)).thenReturn(Optional.of(completed));
            when(requestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(mapper.toResponse(any())).thenReturn(requestResponse);

            service.markAsRated(1L);

            verify(requestRepo).save(argThat(sr -> sr.getRated().equals(true)));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when request not found")
        void markAsRated_notFound() {
            when(requestRepo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.markAsRated(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ══════════════════════════════════════════════════════════
    // STATUS LIFECYCLE TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Status lifecycle — state machine validation")
    class StatusLifecycleTests {

        @Test
        @DisplayName("Cannot quote a QUOTED request")
        void cannotQuoteAlreadyQuoted() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(quotedRequest));
            assertThatThrownBy(() -> service.submitQuote(1L, quoteRequest, 20L, "Dilip"))
                    .isInstanceOf(InvalidStateException.class);
        }

        @Test
        @DisplayName("Cannot approve a PENDING request")
        void cannotApprovePending() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            assertThatThrownBy(() -> service.approveQuote(1L))
                    .isInstanceOf(InvalidStateException.class);
        }

        @Test
        @DisplayName("Cannot mark IN_PROGRESS a PENDING request")
        void cannotMarkInProgressFromPending() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(pendingRequest));
            assertThatThrownBy(() -> service.markInProgress(1L))
                    .isInstanceOf(InvalidStateException.class);
        }

        @Test
        @DisplayName("Cannot complete an APPROVED request — must be IN_PROGRESS first")
        void cannotCompleteFromApproved() {
            when(requestRepo.findById(1L)).thenReturn(Optional.of(approvedRequest));
            assertThatThrownBy(() -> service.completeRequest(1L, completionRequest))
                    .isInstanceOf(InvalidStateException.class);
        }
    }

    // ─── helper ───────────────────────────────────────────────
    private void mockAvailabilityUpdate() {
        when(technicianWebClient.patch()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString(), any(Object[].class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.toBodilessEntity()).thenReturn(Mono.empty());
    }
}