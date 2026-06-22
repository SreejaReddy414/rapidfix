package com.rapidfix.technician.service.impl;

import com.rapidfix.technician.dto.*;
import com.rapidfix.technician.entity.*;
import com.rapidfix.technician.exception.ResourceNotFoundException;
import com.rapidfix.technician.mapper.TechnicianMapper;
import com.rapidfix.technician.repository.TechnicianRepository;
import com.rapidfix.technician.util.MessageService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TechnicianServiceImpl Tests")
class TechnicianServiceImplTest {

    @Mock private TechnicianRepository repo;
    @Mock private TechnicianMapper mapper;

    private final MessageService messages = new MessageService();
    private TechnicianServiceImpl service;

    // ─── Test data ────────────────────────────────────────────
    private Technician technician;
    private TechnicianRequest techRequest;
    private TechnicianResponse techResponse;

    @BeforeEach
    void setUp() {
        service = new TechnicianServiceImpl(repo, mapper, messages);
        technician = Technician.builder()
                .id(1L).userId(2L)
                .name("Dilip").email("dilip@gmail.com")
                .phone("9876543210")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .availabilityStatus(AvailabilityStatus.OFFLINE)
                .latitude(17.385).longitude(78.486)
                .rating(0.0).totalRatings(0).completedJobs(0)
                .build();

        techRequest = TechnicianRequest.builder()
                .phone("9876543210")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .latitude(17.385).longitude(78.486)
                .build();

        techResponse = TechnicianResponse.builder()
                .id(1L).userId(2L)
                .name("Dilip").email("dilip@gmail.com")
                .phone("9876543210")
                .serviceTypes(Set.of(ServiceType.ELECTRICIAN))
                .availabilityStatus(AvailabilityStatus.OFFLINE)
                .rating(0.0).completedJobs(0)
                .build();
    }

    // ══════════════════════════════════════════════════════════
    // REGISTER TECHNICIAN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("registerTechnician()")
    class RegisterTests {

        @Test
        @DisplayName("Should register technician successfully")
        void register_success() {
            when(repo.existsByUserId(2L)).thenReturn(false);
            when(repo.save(any(Technician.class))).thenReturn(technician);
            when(mapper.toResponse(technician)).thenReturn(techResponse);

            TechnicianResponse result = service.registerTechnician(techRequest, 2L, "Dilip", "dilip@gmail.com");

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Dilip");
            assertThat(result.getEmail()).isEqualTo("dilip@gmail.com");
            verify(repo).save(any(Technician.class));
        }

        @Test
        @DisplayName("Should set OFFLINE status on registration")
        void register_defaultStatusOffline() {
            when(repo.existsByUserId(2L)).thenReturn(false);
            when(repo.save(any(Technician.class))).thenAnswer(inv -> {
                Technician t = inv.getArgument(0);
                assertThat(t.getAvailabilityStatus()).isEqualTo(AvailabilityStatus.OFFLINE);
                return technician;
            });
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.registerTechnician(techRequest, 2L, "Dilip", "dilip@gmail.com");

            verify(repo).save(argThat(t -> t.getAvailabilityStatus() == AvailabilityStatus.OFFLINE));
        }

        @Test
        @DisplayName("Should throw RuntimeException when profile already exists")
        void register_duplicateProfile_throwsException() {
            when(repo.existsByUserId(2L)).thenReturn(true);

            assertThatThrownBy(() ->
                    service.registerTechnician(techRequest, 2L, "Dilip", "dilip@gmail.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("already exists");

            verify(repo, never()).save(any());
        }

        @Test
        @DisplayName("Should allow null latitude and longitude on registration")
        void register_nullLocation_allowed() {
            techRequest.setLatitude(null);
            techRequest.setLongitude(null);
            when(repo.existsByUserId(2L)).thenReturn(false);
            when(repo.save(any())).thenReturn(technician);
            when(mapper.toResponse(any())).thenReturn(techResponse);

            assertThatCode(() ->
                    service.registerTechnician(techRequest, 2L, "Dilip", "dilip@gmail.com"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should use name and email from JWT params, not from request body")
        void register_usesJwtParams() {
            when(repo.existsByUserId(2L)).thenReturn(false);
            when(repo.save(any(Technician.class))).thenAnswer(inv -> {
                Technician t = inv.getArgument(0);
                assertThat(t.getName()).isEqualTo("JWT Name");
                assertThat(t.getEmail()).isEqualTo("jwt@email.com");
                return technician;
            });
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.registerTechnician(techRequest, 2L, "JWT Name", "jwt@email.com");

            verify(repo).save(argThat(t ->
                    t.getName().equals("JWT Name") && t.getEmail().equals("jwt@email.com")));
        }
    }

    // ══════════════════════════════════════════════════════════
    // GET TECHNICIAN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getTechnicianById() / getTechnicianByUserId()")
    class GetTechnicianTests {

        @Test
        @DisplayName("Should return technician by ID")
        void getById_success() {
            when(repo.findById(1L)).thenReturn(Optional.of(technician));
            when(mapper.toResponse(technician)).thenReturn(techResponse);

            TechnicianResponse result = service.getTechnicianById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when technician not found by ID")
        void getById_notFound() {
            when(repo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getTechnicianById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Technician not found: 99");
        }

        @Test
        @DisplayName("Should return technician by userId")
        void getByUserId_success() {
            when(repo.findByUserId(2L)).thenReturn(Optional.of(technician));
            when(mapper.toResponse(technician)).thenReturn(techResponse);

            TechnicianResponse result = service.getTechnicianByUserId(2L);

            assertThat(result.getUserId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when technician not found by userId")
        void getByUserId_notFound() {
            when(repo.findByUserId(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getTechnicianByUserId(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Technician not found for userId: 99");
        }
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE AVAILABILITY TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateAvailability()")
    class AvailabilityTests {

        @Test
        @DisplayName("Should update availability to AVAILABLE")
        void updateAvailability_toAvailable() {
            when(repo.findById(1L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenReturn(technician);
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateAvailability(1L, AvailabilityStatus.AVAILABLE);

            verify(repo).save(argThat(t -> t.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE));
        }

        @Test
        @DisplayName("Should update availability to BUSY")
        void updateAvailability_toBusy() {
            when(repo.findById(1L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenReturn(technician);
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateAvailability(1L, AvailabilityStatus.BUSY);

            verify(repo).save(argThat(t -> t.getAvailabilityStatus() == AvailabilityStatus.BUSY));
        }

        @Test
        @DisplayName("Should throw exception when technician not found")
        void updateAvailability_notFound() {
            when(repo.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateAvailability(99L, AvailabilityStatus.AVAILABLE))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE LOCATION TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateLocation()")
    class LocationTests {

        @Test
        @DisplayName("Should update GPS coordinates")
        void updateLocation_success() {
            LocationUpdateRequest req = new LocationUpdateRequest(17.5, 78.6);
            when(repo.findById(1L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenReturn(technician);
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateLocation(1L, req);

            verify(repo).save(argThat(t ->
                    t.getLatitude().equals(17.5) && t.getLongitude().equals(78.6)));
        }
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE PROFILE TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateProfile()")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should partially update phone and skills")
        void updateProfile_success() {
            TechnicianProfileUpdateRequest req = TechnicianProfileUpdateRequest.builder()
                    .phone("9999999999")
                    .serviceTypes(Set.of(ServiceType.PLUMBER))
                    .build();

            when(repo.findByUserId(10L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenReturn(technician);
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateProfile(10L, req);

            verify(repo).save(argThat(t ->
                    t.getPhone().equals("9999999999") && t.getServiceTypes().contains(ServiceType.PLUMBER)));
        }
    }

    // ══════════════════════════════════════════════════════════
    // RATING TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateRatingByUserId()")
    class RatingTests {

        @Test
        @DisplayName("Should calculate rolling average correctly — first rating")
        void rating_firstRating_averageIsRating() {
            technician.setRating(0.0);
            technician.setTotalRatings(0);
            RatingRequest req = new RatingRequest(5);

            when(repo.findByUserId(2L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateRatingByUserId(2L, req);

            verify(repo).save(argThat(t -> {
                // (0.0 * 0 + 5) / 1 = 5.0
                assertThat(t.getRating()).isEqualTo(5.0);
                assertThat(t.getTotalRatings()).isEqualTo(1);
                assertThat(t.getCompletedJobs()).isEqualTo(1);
                return true;
            }));
        }

        @Test
        @DisplayName("Should calculate rolling average correctly — second rating")
        void rating_secondRating_correctAverage() {
            technician.setRating(5.0);
            technician.setTotalRatings(1);
            technician.setCompletedJobs(1);
            RatingRequest req = new RatingRequest(3);

            when(repo.findByUserId(2L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateRatingByUserId(2L, req);

            verify(repo).save(argThat(t -> {
                // (5.0 * 1 + 3) / 2 = 4.0
                assertThat(t.getRating()).isEqualTo(4.0);
                assertThat(t.getTotalRatings()).isEqualTo(2);
                assertThat(t.getCompletedJobs()).isEqualTo(2);
                return true;
            }));
        }

        @Test
        @DisplayName("Should increment completedJobs on rating")
        void rating_incrementsCompletedJobs() {
            technician.setCompletedJobs(5);
            technician.setTotalRatings(5);
            technician.setRating(4.0);
            RatingRequest req = new RatingRequest(4);

            when(repo.findByUserId(2L)).thenReturn(Optional.of(technician));
            when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(mapper.toResponse(any())).thenReturn(techResponse);

            service.updateRatingByUserId(2L, req);

            verify(repo).save(argThat(t -> t.getCompletedJobs() == 6));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when technician userId not found")
        void rating_userIdNotFound() {
            when(repo.findByUserId(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateRatingByUserId(99L, new RatingRequest(5)))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Technician not found for userId: 99");
        }
    }

    // ══════════════════════════════════════════════════════════
    // NEARBY SEARCH TESTS (HAVERSINE)
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("findNearbyAvailable() — Haversine")
    class NearbySearchTests {

        @Test
        @DisplayName("Should return technicians within radius")
        void findNearby_withinRadius_returned() {
            // User at Hyderabad: 17.385, 78.486
            // Technician at ~2km away
            technician.setLatitude(17.400);
            technician.setLongitude(78.500);
            technician.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

            NearbyTechnicianResponse nearbyResponse = NearbyTechnicianResponse.builder()
                    .id(1L).userId(2L).name("Dilip").distanceKm(2.1).build();

            when(repo.findAvailableByServiceType(ServiceType.ELECTRICIAN))
                    .thenReturn(List.of(technician));
            when(mapper.toNearbyResponse(eq(technician), anyDouble())).thenReturn(nearbyResponse);

            List<NearbyTechnicianResponse> result = service.findNearbyAvailable(
                    17.385, 78.486, 10.0, ServiceType.ELECTRICIAN);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Dilip");
        }

        @Test
        @DisplayName("Should exclude technicians beyond radius")
        void findNearby_beyondRadius_excluded() {
            // Technician very far away (~500km)
            technician.setLatitude(12.971);
            technician.setLongitude(77.595); // Bengaluru
            technician.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

            when(repo.findAvailableByServiceType(ServiceType.ELECTRICIAN))
                    .thenReturn(List.of(technician));

            List<NearbyTechnicianResponse> result = service.findNearbyAvailable(
                    17.385, 78.486, 10.0, ServiceType.ELECTRICIAN);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should exclude technicians with null coordinates")
        void findNearby_nullCoordinates_excluded() {
            technician.setLatitude(null);
            technician.setLongitude(null);

            when(repo.findAvailableByServiceType(ServiceType.ELECTRICIAN))
                    .thenReturn(List.of(technician));

            List<NearbyTechnicianResponse> result = service.findNearbyAvailable(
                    17.385, 78.486, 10.0, ServiceType.ELECTRICIAN);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should use findByAvailabilityStatus when serviceType is null")
        void findNearby_nullServiceType_usesAvailabilityQuery() {
            when(repo.findByAvailabilityStatus(AvailabilityStatus.AVAILABLE))
                    .thenReturn(List.of());

            service.findNearbyAvailable(17.385, 78.486, 10.0, null);

            verify(repo).findByAvailabilityStatus(AvailabilityStatus.AVAILABLE);
            verify(repo, never()).findAvailableByServiceType(any());
        }

        @Test
        @DisplayName("Should return empty list when no AVAILABLE technicians")
        void findNearby_noAvailableTechnicians_empty() {
            when(repo.findAvailableByServiceType(ServiceType.PLUMBER)).thenReturn(List.of());

            List<NearbyTechnicianResponse> result = service.findNearbyAvailable(
                    17.385, 78.486, 10.0, ServiceType.PLUMBER);

            assertThat(result).isEmpty();
        }
    }

    // ══════════════════════════════════════════════════════════
    // DELETE TECHNICIAN TESTS
    // ══════════════════════════════════════════════════════════

    @Nested
    @DisplayName("deleteTechnician()")
    class DeleteTests {

        @Test
        @DisplayName("Should delete technician successfully")
        void delete_success() {
            when(repo.existsById(1L)).thenReturn(true);
            doNothing().when(repo).deleteById(1L);

            assertThatCode(() -> service.deleteTechnician(1L)).doesNotThrowAnyException();
            verify(repo).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when technician not found")
        void delete_notFound() {
            when(repo.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteTechnician(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Technician not found: 99");

            verify(repo, never()).deleteById(any());
        }
    }
}