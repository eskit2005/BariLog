package com.barilog.services;

import com.barilog.dtos.request.*;
import com.barilog.dtos.response.InspectionResponse;
import com.barilog.dtos.response.TenancyAgreementResponse;
import com.barilog.entities.*;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.TenancyAgreementMapper;
import com.barilog.mappers.TenancyInspectionMapper;
import com.barilog.models.EmergencyContact;
import com.barilog.models.ResidentProfile;
import com.barilog.repositories.ApartmentRepository;
import com.barilog.repositories.ResidentRepository;
import com.barilog.repositories.TenancyAgreementRepository;
import com.barilog.repositories.TenancyInspectionRepository;
import com.barilog.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final TenancyAgreementRepository tenancyAgreementRepository;
    private final TenancyInspectionRepository tenancyInspectionRepository;
    private final ApartmentService apartmentService;
    private final TenancyAgreementMapper tenancyAgreementMapper;
    private final TenancyInspectionMapper tenancyInspectionMapper;
    private final AuthService authService;
    private final BCryptPasswordEncoder passwordEncoder;

    // -------------------------------------------------------------------------
    // 1. Resident Management & Onboarding
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ResidentProfile> getResidents(String query, String classification, String allocationStatus) {
        List<Resident> list;
        if (query != null && !query.trim().isEmpty()) {
            list = residentRepository.searchResidents(query.trim());
        } else if (classification != null && !classification.equalsIgnoreCase("ALL")) {
            list = residentRepository.findByResidentType(normalizeType(classification));
        } else {
            list = residentRepository.findAll();
        }

        return list.stream()
                .map(this::buildResidentProfile)
                .filter(p -> {
                    if ("ALLOCATED".equalsIgnoreCase(allocationStatus)) {
                        return p.getApartmentId() != null;
                    } else if ("UNALLOCATED".equalsIgnoreCase(allocationStatus)) {
                        return p.getApartmentId() == null;
                    }
                    return true;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ResidentProfile getResidentProfile(Long id) {
        Resident resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident record not found with ID: " + id));
        return buildResidentProfile(resident);
    }

    @Transactional
    public ResidentProfile registerResident(ResidentRegisterRequest request) {
        if (userRepository.countByEmail(request.getEmail().trim().toLowerCase()) > 0) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        Resident resident = new Resident();
        resident.setName(request.getName().trim());
        resident.setEmail(request.getEmail().trim().toLowerCase());
        resident.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        resident.setPhoneNumber(request.getPhoneNumber());
        resident.setRole("RESIDENT");
        resident.setIsActive(true);

        String type = normalizeType(request.getResidentType());
        resident.setResidentType(type);
        resident.setNidPassportNumber(request.getNidPassportNumber());
        resident.setBloodGroup(request.getBloodGroup());
        resident.setOccupation(request.getOccupation());

        // Shared emergency contact details on resident entity
        resident.setEmergencyContactName(request.getEmergencyContactName());
        resident.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Resident saved = residentRepository.save(resident);

        // Optional initial apartment allocation
        if (request.getInitialApartmentId() != null) {
            ResidentAllocationRequest allocReq = new ResidentAllocationRequest();
            allocReq.setApartmentId(request.getInitialApartmentId());
            allocReq.setResidentType(type);
            allocReq.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
            allocReq.setEndDate(request.getEndDate() != null ? request.getEndDate() : LocalDate.now().plusMonths(12));
            allocReq.setRentAmount(request.getRentAmount() != null ? request.getRentAmount() : BigDecimal.ZERO);
            allocReq.setDepositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : BigDecimal.ZERO);
            allocReq.setPaymentFrequency(request.getPaymentFrequency() != null ? request.getPaymentFrequency() : "MONTHLY");
            allocReq.setTerms(request.getTerms());
            return allocateApartment(saved.getId(), allocReq);
        }

        return buildResidentProfile(saved);
    }

    @Transactional
    public ResidentProfile updateResidentProfile(Long id, ResidentRegisterRequest request) {
        Resident resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + id));

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!newEmail.equalsIgnoreCase(resident.getEmail())) {
            Optional<User> existing = userRepository.findByEmail(newEmail);
            if (existing.isPresent() && !existing.get().getId().equals(resident.getId())) {
                throw new DuplicateResourceException("Email already registered: " + newEmail);
            }
            resident.setEmail(newEmail);
        }

        resident.setName(request.getName().trim());
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            resident.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        resident.setPhoneNumber(request.getPhoneNumber());
        if (request.getResidentType() != null) {
            resident.setResidentType(normalizeType(request.getResidentType()));
        }
        resident.setNidPassportNumber(request.getNidPassportNumber());
        resident.setBloodGroup(request.getBloodGroup());
        resident.setOccupation(request.getOccupation());
        resident.setEmergencyContactName(request.getEmergencyContactName());
        resident.setEmergencyContactPhone(request.getEmergencyContactPhone());

        Resident saved = residentRepository.save(resident);
        return buildResidentProfile(saved);
    }

    // -------------------------------------------------------------------------
    // 2. Apartment Allocation & Move-Out Lifecycle
    // -------------------------------------------------------------------------

    @Transactional
    public ResidentProfile allocateApartment(Long residentId, ResidentAllocationRequest request) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + residentId));

        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + request.getApartmentId()));

        // Validate availability: unit must be VACANT
        if (apartment.getOccupancyStatus() != OccupancyStatus.VACANT) {
            throw new DuplicateResourceException("Apartment unit '" + apartment.getUnitNumber() 
                    + "' is currently " + apartment.getOccupancyStatus() + ". Cannot allocate an occupied unit.");
        }

        // Validate no conflicting active or upcoming lease
        boolean hasActiveLease = tenancyAgreementRepository.existsByApartmentIdAndStatusIn(
                apartment.getId(), List.of(TenancyStatus.ACTIVE, TenancyStatus.UPCOMING)
        );
        if (hasActiveLease) {
            throw new DuplicateResourceException("Apartment unit '" + apartment.getUnitNumber() 
                    + "' already has an active or upcoming tenancy agreement.");
        }

        // Validate resident does not already occupy another flat
        List<Apartment> currentlyAssigned = apartmentRepository.findByCurrentResidentId(resident.getId());
        if (!currentlyAssigned.isEmpty() && !currentlyAssigned.get(0).getId().equals(apartment.getId())) {
            throw new DuplicateResourceException("Resident '" + resident.getName() + "' is already assigned to unit '" 
                    + currentlyAssigned.get(0).getUnitNumber() + "'. Vacate current unit first.");
        }

        String classification = request.getResidentType() != null 
                ? normalizeType(request.getResidentType()) 
                : normalizeType(resident.getResidentType());

        resident.setResidentType(classification);
        residentRepository.save(resident);

        LocalDate effDate = request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now();

        if (classification.equalsIgnoreCase("OWNER") || classification.equalsIgnoreCase("OWNER_RESIDENT")) {
            // Owner Allocation: No tenancy agreement required!
            OccupancyUpdateRequest occReq = new OccupancyUpdateRequest();
            occReq.setNewStatus(OccupancyStatus.OWNER_OCCUPIED);
            occReq.setNewResidentId(resident.getId());
            occReq.setEffectiveDate(effDate);
            occReq.setNotes(request.getNotes() != null ? request.getNotes() : "Owner occupancy allocated to unit");
            apartmentService.updateOccupancyStatus(apartment.getId(), occReq);
        } else {
            // Tenant Allocation: Tenancy Agreement is required
            validateTenancyDates(request.getStartDate(), request.getEndDate());

            if (request.getRentAmount() == null || request.getRentAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Rent amount cannot be negative");
            }

            LocalDate startDate = request.getStartDate();
            LocalDate endDate = request.getEndDate();
            TenancyStatus status = startDate.isAfter(LocalDate.now()) ? TenancyStatus.UPCOMING : TenancyStatus.ACTIVE;

            String agreementNumber = (request.getAgreementNumber() != null && !request.getAgreementNumber().trim().isEmpty())
                    ? request.getAgreementNumber().trim()
                    : generateAgreementNumber(apartment.getUnitNumber());

            TenancyAgreement agreement = new TenancyAgreement();
            agreement.setAgreementNumber(agreementNumber);
            agreement.setApartment(apartment);
            agreement.setResident(resident);
            agreement.setStartDate(startDate);
            agreement.setEndDate(endDate);
            agreement.setRentAmount(request.getRentAmount());
            agreement.setDepositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : BigDecimal.ZERO);
            agreement.setPaymentFrequency(request.getPaymentFrequency() != null ? request.getPaymentFrequency() : "MONTHLY");
            agreement.setTerms(request.getTerms());
            agreement.setNotes(request.getNotes());
            agreement.setStatus(status);
            agreement.setIsArchived(false);
            agreement.setCreatedBy(authService.getLoggedUser());
            tenancyAgreementRepository.save(agreement);

            // Coordinate occupancy status update through Feature 01 (ApartmentService)
            if (status == TenancyStatus.ACTIVE) {
                OccupancyUpdateRequest occReq = new OccupancyUpdateRequest();
                occReq.setNewStatus(OccupancyStatus.RENTED);
                occReq.setNewResidentId(resident.getId());
                occReq.setEffectiveDate(startDate);
                occReq.setNotes("Tenant allocated under agreement " + agreementNumber + ". " + (request.getNotes() != null ? request.getNotes() : ""));
                apartmentService.updateOccupancyStatus(apartment.getId(), occReq);
            }
        }

        return buildResidentProfile(resident);
    }

    @Transactional
    public ResidentProfile processMoveOut(Long residentId, MoveOutRequest request) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + residentId));

        List<Apartment> assigned = apartmentRepository.findByCurrentResidentId(resident.getId());
        if (assigned.isEmpty()) {
            throw new ResourceNotFoundException("Resident '" + resident.getName() + "' is not currently assigned to any apartment.");
        }

        Apartment apartment = assigned.get(0);
        LocalDate effDate = (request != null && request.getEffectiveDate() != null) ? request.getEffectiveDate() : LocalDate.now();

        // 1. Archive active/upcoming tenancy agreements
        List<TenancyAgreement> activeAgreements = tenancyAgreementRepository.findByResidentIdAndStatusIn(
                resident.getId(), List.of(TenancyStatus.ACTIVE, TenancyStatus.UPCOMING)
        );
        for (TenancyAgreement agreement : activeAgreements) {
            agreement.setStatus(TenancyStatus.TERMINATED);
            agreement.setIsArchived(true);
            tenancyAgreementRepository.save(agreement);
        }

        // 2. Schedule or record move-out inspection if requested
        if (request != null && Boolean.TRUE.equals(request.getScheduleInspection())) {
            TenancyInspection inspection = new TenancyInspection();
            inspection.setApartment(apartment);
            inspection.setResident(resident);
            inspection.setInspectionType(InspectionType.MOVE_OUT);
            inspection.setScheduledDate(effDate);
            inspection.setScheduledTime("11:00 AM");
            inspection.setInspectorName(request.getInspectorName() != null ? request.getInspectorName() : authService.getLoggedUser().getName());
            inspection.setStatus(InspectionStatus.COMPLETED);
            inspection.setNotes(request.getNotes());
            inspection.setConditionReport(request.getConditionReport() != null ? request.getConditionReport() : "Move-out inspection verified. Unit vacated.");
            inspection.setKeysHandedOver(request.getKeysReturned() != null ? request.getKeysReturned() : true);
            inspection.setCompletedAt(Instant.now());
            if (!activeAgreements.isEmpty()) {
                inspection.setTenancyAgreement(activeAgreements.get(0));
            }
            tenancyInspectionRepository.save(inspection);
        }

        // 3. Coordinate apartment vacancy transition through Feature 01 (ApartmentService)
        OccupancyUpdateRequest occReq = new OccupancyUpdateRequest();
        occReq.setNewStatus(OccupancyStatus.VACANT);
        occReq.setNewResidentId(null);
        occReq.setEffectiveDate(effDate);
        occReq.setNotes("Move-out completed for resident " + resident.getName() + ". Unit vacated.");
        apartmentService.updateOccupancyStatus(apartment.getId(), occReq);

        return buildResidentProfile(resident);
    }

    // -------------------------------------------------------------------------
    // 3. Tenancy Agreement Management
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TenancyAgreementResponse> getTenancyAgreements(Long apartmentId, Long residentId, TenancyStatus status, Boolean archived) {
        List<TenancyAgreement> agreements;

        if (apartmentId != null) {
            agreements = tenancyAgreementRepository.findByApartmentIdOrderByStartDateDesc(apartmentId);
        } else if (residentId != null) {
            agreements = tenancyAgreementRepository.findByResidentIdOrderByStartDateDesc(residentId);
        } else if (status != null) {
            agreements = tenancyAgreementRepository.findByStatus(status);
        } else if (archived != null) {
            agreements = tenancyAgreementRepository.findByIsArchived(archived);
        } else {
            agreements = tenancyAgreementRepository.findAll();
        }

        // Natural expiration check: preserve distinct TERMINATED status
        LocalDate today = LocalDate.now();
        return agreements.stream()
                .map(a -> {
                    if (a.getStatus() == TenancyStatus.ACTIVE && a.getEndDate().isBefore(today)) {
                        a.setStatus(TenancyStatus.EXPIRED);
                        tenancyAgreementRepository.save(a);
                    }
                    return tenancyAgreementMapper.toResponse(a);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public TenancyAgreementResponse getTenancyAgreementById(Long id) {
        TenancyAgreement agreement = tenancyAgreementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy agreement not found with ID: " + id));
        return tenancyAgreementMapper.toResponse(agreement);
    }

    @Transactional
    public TenancyAgreementResponse createTenancyAgreement(TenancyAgreementRequest request) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + request.getApartmentId()));

        User resident = userRepository.findById(request.getResidentId())
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + request.getResidentId()));

        validateTenancyDates(request.getStartDate(), request.getEndDate());

        if (request.getRentAmount() == null || request.getRentAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Rent amount cannot be negative");
        }

        if (apartment.getOccupancyStatus() != OccupancyStatus.VACANT) {
            throw new DuplicateResourceException("Apartment unit '" + apartment.getUnitNumber() 
                    + "' is currently " + apartment.getOccupancyStatus() + ". Cannot lease an occupied unit.");
        }

        boolean hasActiveAgreement = tenancyAgreementRepository.existsByApartmentIdAndStatusIn(
                apartment.getId(), List.of(TenancyStatus.ACTIVE, TenancyStatus.UPCOMING)
        );
        if (hasActiveAgreement) {
            throw new DuplicateResourceException("Apartment unit '" + apartment.getUnitNumber() 
                    + "' already has an active or upcoming tenancy agreement.");
        }

        String agreementNumber = (request.getAgreementNumber() != null && !request.getAgreementNumber().trim().isEmpty())
                ? request.getAgreementNumber().trim()
                : generateAgreementNumber(apartment.getUnitNumber());

        if (tenancyAgreementRepository.existsByAgreementNumber(agreementNumber)) {
            agreementNumber = generateAgreementNumber(apartment.getUnitNumber());
        }

        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        TenancyStatus status = startDate.isAfter(LocalDate.now()) ? TenancyStatus.UPCOMING : TenancyStatus.ACTIVE;

        TenancyAgreement agreement = new TenancyAgreement();
        agreement.setAgreementNumber(agreementNumber);
        agreement.setApartment(apartment);
        agreement.setResident(resident);
        agreement.setStartDate(startDate);
        agreement.setEndDate(endDate);
        agreement.setRentAmount(request.getRentAmount());
        agreement.setDepositAmount(request.getDepositAmount() != null ? request.getDepositAmount() : BigDecimal.ZERO);
        agreement.setPaymentFrequency(request.getPaymentFrequency() != null ? request.getPaymentFrequency() : "MONTHLY");
        agreement.setTerms(request.getTerms());
        agreement.setNotes(request.getNotes());
        agreement.setDocumentReferenceId(request.getDocumentReferenceId());
        agreement.setStatus(status);
        agreement.setIsArchived(false);
        agreement.setCreatedBy(authService.getLoggedUser());

        TenancyAgreement saved = tenancyAgreementRepository.save(agreement);

        // Coordinate occupancy status update through Feature 01 (ApartmentService)
        if (status == TenancyStatus.ACTIVE) {
            OccupancyUpdateRequest occReq = new OccupancyUpdateRequest();
            occReq.setNewStatus(OccupancyStatus.RENTED);
            occReq.setNewResidentId(resident.getId());
            occReq.setEffectiveDate(startDate);
            occReq.setNotes("Tenancy agreement executed: " + agreementNumber);
            apartmentService.updateOccupancyStatus(apartment.getId(), occReq);
        }

        return tenancyAgreementMapper.toResponse(saved);
    }

    @Transactional
    public TenancyAgreementResponse updateTenancyAgreement(Long id, TenancyAgreementRequest request) {
        TenancyAgreement agreement = tenancyAgreementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy agreement not found with ID: " + id));

        validateTenancyDates(request.getStartDate(), request.getEndDate());

        if (request.getRentAmount() == null || request.getRentAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Rent amount cannot be negative");
        }

        agreement.setStartDate(request.getStartDate());
        agreement.setEndDate(request.getEndDate());
        agreement.setRentAmount(request.getRentAmount());
        if (request.getDepositAmount() != null) {
            agreement.setDepositAmount(request.getDepositAmount());
        }
        if (request.getPaymentFrequency() != null) {
            agreement.setPaymentFrequency(request.getPaymentFrequency());
        }
        agreement.setTerms(request.getTerms());
        agreement.setNotes(request.getNotes());
        if (request.getDocumentReferenceId() != null) {
            agreement.setDocumentReferenceId(request.getDocumentReferenceId());
        }

        return tenancyAgreementMapper.toResponse(tenancyAgreementRepository.save(agreement));
    }

    @Transactional
    public TenancyAgreementResponse terminateTenancyAgreement(Long id, String reason) {
        TenancyAgreement agreement = tenancyAgreementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenancy agreement not found with ID: " + id));

        // Preserve distinct TERMINATED status
        agreement.setStatus(TenancyStatus.TERMINATED);
        agreement.setIsArchived(true);
        if (reason != null && !reason.trim().isEmpty()) {
            agreement.setNotes((agreement.getNotes() != null ? agreement.getNotes() + " | " : "") + "Terminated: " + reason.trim());
        }

        TenancyAgreement saved = tenancyAgreementRepository.save(agreement);

        // Coordinate vacating the apartment via Feature 01 (ApartmentService)
        OccupancyUpdateRequest occReq = new OccupancyUpdateRequest();
        occReq.setNewStatus(OccupancyStatus.VACANT);
        occReq.setNewResidentId(null);
        occReq.setEffectiveDate(LocalDate.now());
        occReq.setNotes("Tenancy agreement " + agreement.getAgreementNumber() + " terminated early. " + (reason != null ? reason : ""));
        apartmentService.updateOccupancyStatus(agreement.getApartment().getId(), occReq);

        return tenancyAgreementMapper.toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // 4. Move-In & Move-Out Inspections
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<InspectionResponse> getInspections(Long apartmentId, Long residentId, InspectionType type, InspectionStatus status) {
        List<TenancyInspection> inspections;
        if (apartmentId != null) {
            inspections = tenancyInspectionRepository.findByApartmentIdOrderByScheduledDateDesc(apartmentId);
        } else if (residentId != null) {
            inspections = tenancyInspectionRepository.findByResidentIdOrderByScheduledDateDesc(residentId);
        } else if (type != null) {
            inspections = tenancyInspectionRepository.findByInspectionType(type);
        } else if (status != null) {
            inspections = tenancyInspectionRepository.findByStatus(status);
        } else {
            inspections = tenancyInspectionRepository.findAllByOrderByScheduledDateDesc();
        }

        return inspections.stream()
                .map(tenancyInspectionMapper::toResponse)
                .toList();
    }

    @Transactional
    public InspectionResponse scheduleInspection(InspectionRequest request) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + request.getApartmentId()));

        User resident = userRepository.findById(request.getResidentId())
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + request.getResidentId()));

        TenancyAgreement agreement = null;
        if (request.getTenancyAgreementId() != null) {
            agreement = tenancyAgreementRepository.findById(request.getTenancyAgreementId()).orElse(null);
        }

        User currentUser = authService.getLoggedUser();

        TenancyInspection inspection = new TenancyInspection();
        inspection.setApartment(apartment);
        inspection.setResident(resident);
        inspection.setTenancyAgreement(agreement);
        inspection.setInspectionType(request.getInspectionType());
        inspection.setScheduledDate(request.getScheduledDate());
        inspection.setScheduledTime(request.getScheduledTime() != null ? request.getScheduledTime() : "10:00 AM");
        inspection.setInspectorName(request.getInspectorName() != null ? request.getInspectorName() : currentUser.getName());
        inspection.setStatus(InspectionStatus.SCHEDULED);
        inspection.setNotes(request.getNotes());
        inspection.setConditionReport(request.getConditionReport());
        inspection.setKeysHandedOver(request.getKeysHandedOver() != null ? request.getKeysHandedOver() : false);

        TenancyInspection saved = tenancyInspectionRepository.save(inspection);
        return tenancyInspectionMapper.toResponse(saved);
    }

    @Transactional
    public InspectionResponse updateInspectionStatus(Long id, InspectionStatusUpdateRequest request) {
        TenancyInspection inspection = tenancyInspectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found with ID: " + id));

        inspection.setStatus(request.getStatus());
        if (request.getConditionReport() != null) {
            inspection.setConditionReport(request.getConditionReport());
        }
        if (request.getNotes() != null) {
            inspection.setNotes(request.getNotes());
        }
        if (request.getKeysHandedOver() != null) {
            inspection.setKeysHandedOver(request.getKeysHandedOver());
        }
        if (request.getStatus() == InspectionStatus.COMPLETED) {
            inspection.setCompletedAt(Instant.now());
        }

        return tenancyInspectionMapper.toResponse(tenancyInspectionRepository.save(inspection));
    }

    @Transactional
    public void deleteInspection(Long id) {
        if (!tenancyInspectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Inspection not found with ID: " + id);
        }
        tenancyInspectionRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // 5. Historical Tenancy Queries
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TenancyAgreementResponse> getApartmentTenancyHistory(Long apartmentId) {
        if (!apartmentRepository.existsById(apartmentId)) {
            throw new ResourceNotFoundException("Apartment not found with ID: " + apartmentId);
        }
        return tenancyAgreementRepository.findByApartmentIdOrderByStartDateDesc(apartmentId).stream()
                .map(tenancyAgreementMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TenancyAgreementResponse> getResidentTenancyHistory(Long residentId) {
        if (!userRepository.existsById(residentId)) {
            throw new ResourceNotFoundException("Resident not found with ID: " + residentId);
        }
        return tenancyAgreementRepository.findByResidentIdOrderByStartDateDesc(residentId).stream()
                .map(tenancyAgreementMapper::toResponse)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Profile Builder Helper
    // -------------------------------------------------------------------------

    private ResidentProfile buildResidentProfile(Resident resident) {
        boolean isOwner = resident.getResidentType() != null 
                && (resident.getResidentType().equalsIgnoreCase("OWNER") || resident.getResidentType().equalsIgnoreCase("OWNER_RESIDENT"));

        ResidentProfile.ResidentProfileBuilder builder = ResidentProfile.builder()
                .id(resident.getId())
                .name(resident.getName())
                .email(resident.getEmail())
                .phoneNumber(resident.getPhoneNumber())
                .residentType(resident.getResidentType())
                .classification(isOwner ? "Owner" : "Tenant")
                .nidPassportNumber(resident.getNidPassportNumber())
                .bloodGroup(resident.getBloodGroup())
                .occupation(resident.getOccupation())
                .emergencyContact(EmergencyContact.builder()
                        .name(resident.getEmergencyContactName())
                        .phone(resident.getEmergencyContactPhone())
                        .build())
                .isActive(resident.getIsActive())
                .createdAt(resident.getCreatedAt());

        // Check assigned apartment
        List<Apartment> assigned = apartmentRepository.findByCurrentResidentId(resident.getId());
        if (!assigned.isEmpty()) {
            Apartment apt = assigned.get(0);
            builder.apartmentId(apt.getId())
                   .unitNumber(apt.getUnitNumber())
                   .buildingId(apt.getBuilding() != null ? apt.getBuilding().getId() : null)
                   .buildingName(apt.getBuilding() != null ? apt.getBuilding().getName() : null)
                   .floorNumber(apt.getFloor() != null ? apt.getFloor().getFloorNumber() : null)
                   .bhkType(apt.getBhkType())
                   .sizeSqft(apt.getSizeSqft())
                   .occupancyStatus(apt.getOccupancyStatus());
        }

        // Check active agreement
        Optional<TenancyAgreement> activeAg = tenancyAgreementRepository
                .findFirstByResidentIdAndStatusInOrderByStartDateDesc(resident.getId(), List.of(TenancyStatus.ACTIVE, TenancyStatus.UPCOMING));
        activeAg.ifPresent(ag -> builder
                .activeAgreementId(ag.getId())
                .activeAgreementNumber(ag.getAgreementNumber())
                .rentAmount(ag.getRentAmount())
                .depositAmount(ag.getDepositAmount())
                .tenancyStartDate(ag.getStartDate())
                .tenancyEndDate(ag.getEndDate())
                .tenancyStatus(ag.getStatus().name())
        );

        return builder.build();
    }

    private void validateTenancyDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            throw new IllegalArgumentException("Tenancy commencement start date is required");
        }
        if (endDate == null) {
            throw new IllegalArgumentException("Tenancy expiry end date is required");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Tenancy expiry end date (" + endDate + ") cannot be before commencement start date (" + startDate + ")");
        }
    }

    private String generateAgreementNumber(String unitNumber) {
        return "TEN-" + unitNumber + "-" + (System.currentTimeMillis() % 1000000);
    }

    private String normalizeType(String type) {
        if (type == null) return "TENANT";
        String upper = type.trim().toUpperCase();
        if (upper.contains("OWNER")) return "OWNER";
        return "TENANT";
    }
}
