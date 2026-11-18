package com.barilog;

import com.barilog.dtos.request.*;
import com.barilog.dtos.response.InspectionResponse;
import com.barilog.dtos.response.TenancyAgreementResponse;
import com.barilog.entities.*;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.TenancyAgreementMapper;
import com.barilog.mappers.TenancyInspectionMapper;
import com.barilog.models.ResidentProfile;
import com.barilog.repositories.ApartmentRepository;
import com.barilog.repositories.ResidentRepository;
import com.barilog.repositories.TenancyAgreementRepository;
import com.barilog.repositories.TenancyInspectionRepository;
import com.barilog.repositories.UserRepository;
import com.barilog.services.ApartmentService;
import com.barilog.services.AuthService;
import com.barilog.services.ResidentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ResidentServiceTest {

    @Mock
    private ResidentRepository residentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private TenancyAgreementRepository tenancyAgreementRepository;
    @Mock
    private TenancyInspectionRepository tenancyInspectionRepository;
    @Mock
    private ApartmentService apartmentService;
    @Mock
    private TenancyAgreementMapper tenancyAgreementMapper;
    @Mock
    private TenancyInspectionMapper tenancyInspectionMapper;
    @Mock
    private AuthService authService;
    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private ResidentService residentService;

    private User managerUser;
    private Resident testResident;
    private Apartment testApartment;
    private Building testBuilding;

    @BeforeEach
    void setUp() {
        managerUser = new User();
        managerUser.setId(1L);
        managerUser.setName("Property Manager");
        managerUser.setEmail("manager@barilog.com");
        managerUser.setRole("MANAGER");

        testBuilding = new Building();
        testBuilding.setId(10L);
        testBuilding.setName("Tower Alpha");

        testApartment = new Apartment();
        testApartment.setId(101L);
        testApartment.setUnitNumber("A-402");
        testApartment.setBuilding(testBuilding);
        testApartment.setOccupancyStatus(OccupancyStatus.VACANT);

        testResident = new Resident();
        testResident.setId(201L);
        testResident.setName("Rahim Uddin");
        testResident.setEmail("rahim@example.com");
        testResident.setPhoneNumber("01711000111");
        testResident.setResidentType("TENANT");
        testResident.setEmergencyContactName("Karim Uddin");
        testResident.setEmergencyContactPhone("01711222333");

        when(authService.getLoggedUser()).thenReturn(managerUser);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "encoded_" + inv.getArgument(0));
    }

    // -------------------------------------------------------------------------
    // 1. Resident Management & Onboarding Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Should successfully register resident with explicit password and shared emergency contact")
    void registerResident_success() {
        ResidentRegisterRequest request = new ResidentRegisterRequest();
        request.setName("Fatima Begum");
        request.setEmail("fatima@example.com");
        request.setPassword("SecurePass123!");
        request.setPhoneNumber("01811223344");
        request.setResidentType("TENANT");
        request.setEmergencyContactName("Hasan Begum");
        request.setEmergencyContactPhone("01811556677");

        when(userRepository.countByEmail("fatima@example.com")).thenReturn(0);
        when(residentRepository.save(any(Resident.class))).thenAnswer(inv -> {
            Resident r = inv.getArgument(0);
            r.setId(301L);
            return r;
        });

        ResidentProfile profile = residentService.registerResident(request);

        assertNotNull(profile);
        assertEquals(301L, profile.getId());
        assertEquals("Fatima Begum", profile.getName());
        assertEquals("fatima@example.com", profile.getEmail());
        assertEquals("Tenant", profile.getClassification());
        assertNotNull(profile.getEmergencyContact());
        assertEquals("Hasan Begum", profile.getEmergencyContact().getName());

        verify(passwordEncoder).encode("SecurePass123!");
        verify(residentRepository).save(any(Resident.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException if email is already registered")
    void registerResident_duplicateEmail_throwsException() {
        ResidentRegisterRequest request = new ResidentRegisterRequest();
        request.setName("Duplicate User");
        request.setEmail("rahim@example.com");
        request.setPassword("Secret999!");

        when(userRepository.countByEmail("rahim@example.com")).thenReturn(1);

        assertThrows(DuplicateResourceException.class, () -> residentService.registerResident(request));
        verify(residentRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // 2. Apartment Allocation Tests (Owner vs Tenant)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Owner allocation: should update apartment occupancy to OWNER_OCCUPIED without creating TenancyAgreement")
    void allocateApartment_owner_success() {
        ResidentAllocationRequest request = new ResidentAllocationRequest();
        request.setApartmentId(101L);
        request.setResidentType("OWNER");
        request.setEffectiveDate(LocalDate.now());
        request.setNotes("Owner moving in");

        testResident.setResidentType("OWNER");

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(tenancyAgreementRepository.existsByApartmentIdAndStatusIn(eq(101L), anyList())).thenReturn(false);
        when(apartmentRepository.findByCurrentResidentId(201L)).thenReturn(Collections.emptyList());
        when(residentRepository.save(any(Resident.class))).thenReturn(testResident);

        ResidentProfile profile = residentService.allocateApartment(201L, request);

        assertNotNull(profile);
        assertEquals("Owner", profile.getClassification());

        // Verify R1 coordination: apartmentService.updateOccupancyStatus called with OWNER_OCCUPIED
        ArgumentCaptor<OccupancyUpdateRequest> occCaptor = ArgumentCaptor.forClass(OccupancyUpdateRequest.class);
        verify(apartmentService).updateOccupancyStatus(eq(101L), occCaptor.capture());
        assertEquals(OccupancyStatus.OWNER_OCCUPIED, occCaptor.getValue().getNewStatus());
        assertEquals(201L, occCaptor.getValue().getNewResidentId());

        // Verify NO TenancyAgreement was created or saved
        verify(tenancyAgreementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tenant allocation: should create TenancyAgreement and update apartment occupancy to RENTED")
    void allocateApartment_tenant_success() {
        ResidentAllocationRequest request = new ResidentAllocationRequest();
        request.setApartmentId(101L);
        request.setResidentType("TENANT");
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusMonths(12));
        request.setRentAmount(BigDecimal.valueOf(35000));
        request.setDepositAmount(BigDecimal.valueOf(70000));
        request.setPaymentFrequency("MONTHLY");
        request.setTerms("Standard tenancy agreement terms");

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(tenancyAgreementRepository.existsByApartmentIdAndStatusIn(eq(101L), anyList())).thenReturn(false);
        when(apartmentRepository.findByCurrentResidentId(201L)).thenReturn(Collections.emptyList());
        when(residentRepository.save(any(Resident.class))).thenReturn(testResident);

        ResidentProfile profile = residentService.allocateApartment(201L, request);

        assertNotNull(profile);

        // Verify TenancyAgreement was saved
        ArgumentCaptor<TenancyAgreement> agreementCaptor = ArgumentCaptor.forClass(TenancyAgreement.class);
        verify(tenancyAgreementRepository).save(agreementCaptor.capture());
        TenancyAgreement saved = agreementCaptor.getValue();
        assertEquals(testApartment, saved.getApartment());
        assertEquals(testResident, saved.getResident());
        assertEquals(BigDecimal.valueOf(35000), saved.getRentAmount());
        assertEquals(TenancyStatus.ACTIVE, saved.getStatus());
        assertFalse(saved.getIsArchived());

        // Verify R1 coordination: apartmentService.updateOccupancyStatus called with RENTED
        ArgumentCaptor<OccupancyUpdateRequest> occCaptor = ArgumentCaptor.forClass(OccupancyUpdateRequest.class);
        verify(apartmentService).updateOccupancyStatus(eq(101L), occCaptor.capture());
        assertEquals(OccupancyStatus.RENTED, occCaptor.getValue().getNewStatus());
        assertEquals(201L, occCaptor.getValue().getNewResidentId());
    }

    @Test
    @DisplayName("Should prevent allocation if apartment is not VACANT")
    void allocateApartment_conflict_occupiedUnit_throwsException() {
        testApartment.setOccupancyStatus(OccupancyStatus.RENTED);

        ResidentAllocationRequest request = new ResidentAllocationRequest();
        request.setApartmentId(101L);
        request.setResidentType("TENANT");

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));

        assertThrows(DuplicateResourceException.class, () -> residentService.allocateApartment(201L, request));
        verify(apartmentService, never()).updateOccupancyStatus(any(), any());
    }

    @Test
    @DisplayName("Should prevent allocation if apartment has active or upcoming tenancy agreement")
    void allocateApartment_conflict_activeLease_throwsException() {
        ResidentAllocationRequest request = new ResidentAllocationRequest();
        request.setApartmentId(101L);
        request.setResidentType("TENANT");

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(tenancyAgreementRepository.existsByApartmentIdAndStatusIn(eq(101L), anyList())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> residentService.allocateApartment(201L, request));
        verify(apartmentService, never()).updateOccupancyStatus(any(), any());
    }

    @Test
    @DisplayName("Should prevent allocation if resident is already assigned to another unit")
    void allocateApartment_conflict_residentAlreadyAssigned_throwsException() {
        Apartment otherUnit = new Apartment();
        otherUnit.setId(999L);
        otherUnit.setUnitNumber("B-101");

        ResidentAllocationRequest request = new ResidentAllocationRequest();
        request.setApartmentId(101L);
        request.setResidentType("TENANT");

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(tenancyAgreementRepository.existsByApartmentIdAndStatusIn(eq(101L), anyList())).thenReturn(false);
        when(apartmentRepository.findByCurrentResidentId(201L)).thenReturn(List.of(otherUnit));

        assertThrows(DuplicateResourceException.class, () -> residentService.allocateApartment(201L, request));
        verify(apartmentService, never()).updateOccupancyStatus(any(), any());
    }

    // -------------------------------------------------------------------------
    // 3. Move-Out Lifecycle Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Move-out: should terminate and archive agreement, complete move-out inspection, and vacate unit")
    void processMoveOut_success() {
        TenancyAgreement activeAgreement = new TenancyAgreement();
        activeAgreement.setId(401L);
        activeAgreement.setAgreementNumber("TEN-A-402-001");
        activeAgreement.setApartment(testApartment);
        activeAgreement.setResident(testResident);
        activeAgreement.setStatus(TenancyStatus.ACTIVE);
        activeAgreement.setIsArchived(false);

        MoveOutRequest request = new MoveOutRequest();
        request.setEffectiveDate(LocalDate.now());
        request.setNotes("Tenant completed lease term");
        request.setScheduleInspection(true);
        request.setInspectorName("Inspector Gadget");
        request.setConditionReport("Good condition, minor wall wear");
        request.setKeysReturned(true);

        when(residentRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(apartmentRepository.findByCurrentResidentId(201L)).thenReturn(List.of(testApartment));
        when(tenancyAgreementRepository.findByResidentIdAndStatusIn(eq(201L), anyList())).thenReturn(List.of(activeAgreement));

        ResidentProfile profile = residentService.processMoveOut(201L, request);

        assertNotNull(profile);

        // 1. Verify agreement is TERMINATED and archived
        assertEquals(TenancyStatus.TERMINATED, activeAgreement.getStatus());
        assertTrue(activeAgreement.getIsArchived());
        verify(tenancyAgreementRepository).save(activeAgreement);

        // 2. Verify inspection recorded as COMPLETED with keys handed over
        ArgumentCaptor<TenancyInspection> inspCaptor = ArgumentCaptor.forClass(TenancyInspection.class);
        verify(tenancyInspectionRepository).save(inspCaptor.capture());
        TenancyInspection insp = inspCaptor.getValue();
        assertEquals(InspectionType.MOVE_OUT, insp.getInspectionType());
        assertEquals(InspectionStatus.COMPLETED, insp.getStatus());
        assertTrue(insp.getKeysHandedOver());
        assertEquals("Inspector Gadget", insp.getInspectorName());

        // 3. Verify R1 coordination: apartment transitioned to VACANT
        ArgumentCaptor<OccupancyUpdateRequest> occCaptor = ArgumentCaptor.forClass(OccupancyUpdateRequest.class);
        verify(apartmentService).updateOccupancyStatus(eq(101L), occCaptor.capture());
        assertEquals(OccupancyStatus.VACANT, occCaptor.getValue().getNewStatus());
        assertNull(occCaptor.getValue().getNewResidentId());
    }

    // -------------------------------------------------------------------------
    // 4. Tenancy Agreement Management Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Should create tenancy agreement with valid dates and coordinate R1 occupancy")
    void createTenancyAgreement_success() {
        TenancyAgreementRequest request = new TenancyAgreementRequest();
        request.setApartmentId(101L);
        request.setResidentId(201L);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusMonths(12));
        request.setRentAmount(BigDecimal.valueOf(40000));
        request.setDepositAmount(BigDecimal.valueOf(80000));
        request.setPaymentFrequency("MONTHLY");
        request.setTerms("No subletting allowed");

        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(tenancyAgreementRepository.existsByApartmentIdAndStatusIn(eq(101L), anyList())).thenReturn(false);
        when(tenancyAgreementRepository.save(any(TenancyAgreement.class))).thenAnswer(inv -> {
            TenancyAgreement a = inv.getArgument(0);
            a.setId(501L);
            return a;
        });

        TenancyAgreementResponse mockResponse = TenancyAgreementResponse.builder()
                .id(501L)
                .agreementNumber("TEN-A-402-123456")
                .status(TenancyStatus.ACTIVE)
                .rentAmount(BigDecimal.valueOf(40000))
                .build();
        when(tenancyAgreementMapper.toResponse(any())).thenReturn(mockResponse);

        TenancyAgreementResponse response = residentService.createTenancyAgreement(request);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        verify(apartmentService).updateOccupancyStatus(eq(101L), any(OccupancyUpdateRequest.class));
    }

    @Test
    @DisplayName("Should reject tenancy agreement when endDate is before startDate")
    void createTenancyAgreement_invalidDates_throwsException() {
        TenancyAgreementRequest request = new TenancyAgreementRequest();
        request.setApartmentId(101L);
        request.setResidentId(201L);
        request.setStartDate(LocalDate.of(2026, 6, 1));
        request.setEndDate(LocalDate.of(2026, 5, 1)); // End before start
        request.setRentAmount(BigDecimal.valueOf(30000));

        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(201L)).thenReturn(Optional.of(testResident));

        assertThrows(IllegalArgumentException.class, () -> residentService.createTenancyAgreement(request));
        verify(tenancyAgreementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Early termination should preserve distinct TERMINATED status and vacate apartment")
    void terminateTenancyAgreement_earlyTermination_success() {
        TenancyAgreement agreement = new TenancyAgreement();
        agreement.setId(601L);
        agreement.setAgreementNumber("TEN-601");
        agreement.setApartment(testApartment);
        agreement.setResident(testResident);
        agreement.setStatus(TenancyStatus.ACTIVE);
        agreement.setIsArchived(false);

        when(tenancyAgreementRepository.findById(601L)).thenReturn(Optional.of(agreement));
        when(tenancyAgreementRepository.save(any(TenancyAgreement.class))).thenAnswer(inv -> inv.getArgument(0));

        TenancyAgreementResponse mockResp = TenancyAgreementResponse.builder()
                .id(601L)
                .status(TenancyStatus.TERMINATED)
                .isArchived(true)
                .build();
        when(tenancyAgreementMapper.toResponse(any())).thenReturn(mockResp);

        TenancyAgreementResponse result = residentService.terminateTenancyAgreement(601L, "Job relocation");

        assertNotNull(result);
        assertEquals(TenancyStatus.TERMINATED, agreement.getStatus());
        assertTrue(agreement.getIsArchived());
        assertTrue(agreement.getNotes().contains("Job relocation"));

        // Vacate unit
        ArgumentCaptor<OccupancyUpdateRequest> occCaptor = ArgumentCaptor.forClass(OccupancyUpdateRequest.class);
        verify(apartmentService).updateOccupancyStatus(eq(101L), occCaptor.capture());
        assertEquals(OccupancyStatus.VACANT, occCaptor.getValue().getNewStatus());
    }

    @Test
    @DisplayName("Natural expiration check should transition past ACTIVE agreement to EXPIRED")
    void getTenancyAgreements_naturalExpiryCheck() {
        TenancyAgreement pastAgreement = new TenancyAgreement();
        pastAgreement.setId(701L);
        pastAgreement.setStartDate(LocalDate.now().minusMonths(13));
        pastAgreement.setEndDate(LocalDate.now().minusDays(1)); // expired yesterday
        pastAgreement.setStatus(TenancyStatus.ACTIVE);

        when(tenancyAgreementRepository.findAll()).thenReturn(List.of(pastAgreement));

        residentService.getTenancyAgreements(null, null, null, null);

        assertEquals(TenancyStatus.EXPIRED, pastAgreement.getStatus());
        verify(tenancyAgreementRepository).save(pastAgreement);
    }

    // -------------------------------------------------------------------------
    // 5. Inspection Scheduling & Findings Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Should schedule move-in inspection with inspector name and initial notes")
    void scheduleInspection_success() {
        InspectionRequest req = new InspectionRequest();
        req.setApartmentId(101L);
        req.setResidentId(201L);
        req.setInspectionType(InspectionType.MOVE_IN);
        req.setScheduledDate(LocalDate.now().plusDays(2));
        req.setScheduledTime("10:00 AM");
        req.setInspectorName("Inspector Ahmed");
        req.setNotes("Pre-occupancy walkthrough");

        when(apartmentRepository.findById(101L)).thenReturn(Optional.of(testApartment));
        when(userRepository.findById(201L)).thenReturn(Optional.of(testResident));
        when(tenancyInspectionRepository.save(any(TenancyInspection.class))).thenAnswer(inv -> {
            TenancyInspection insp = inv.getArgument(0);
            insp.setId(801L);
            return insp;
        });

        InspectionResponse mockResp = InspectionResponse.builder()
                .id(801L)
                .inspectionType(InspectionType.MOVE_IN)
                .status(InspectionStatus.SCHEDULED)
                .inspectorName("Inspector Ahmed")
                .build();
        when(tenancyInspectionMapper.toResponse(any())).thenReturn(mockResp);

        InspectionResponse response = residentService.scheduleInspection(req);

        assertNotNull(response);
        assertEquals(801L, response.getId());
        assertEquals(InspectionStatus.SCHEDULED, response.getStatus());
    }

    @Test
    @DisplayName("Should update inspection status to COMPLETED with condition findings and keys handed over")
    void updateInspectionStatus_success() {
        TenancyInspection insp = new TenancyInspection();
        insp.setId(801L);
        insp.setStatus(InspectionStatus.SCHEDULED);

        InspectionStatusUpdateRequest updateReq = new InspectionStatusUpdateRequest();
        updateReq.setStatus(InspectionStatus.COMPLETED);
        updateReq.setConditionReport("All appliances functional, 2 keys handed over");
        updateReq.setKeysHandedOver(true);

        when(tenancyInspectionRepository.findById(801L)).thenReturn(Optional.of(insp));
        when(tenancyInspectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InspectionResponse mockResp = InspectionResponse.builder()
                .id(801L)
                .status(InspectionStatus.COMPLETED)
                .keysHandedOver(true)
                .build();
        when(tenancyInspectionMapper.toResponse(any())).thenReturn(mockResp);

        InspectionResponse result = residentService.updateInspectionStatus(801L, updateReq);

        assertNotNull(result);
        assertEquals(InspectionStatus.COMPLETED, insp.getStatus());
        assertTrue(insp.getKeysHandedOver());
        assertNotNull(insp.getCompletedAt());
    }
}
