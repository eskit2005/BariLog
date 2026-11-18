package com.barilog.controllers;

import com.barilog.dtos.request.*;
import com.barilog.dtos.response.InspectionResponse;
import com.barilog.dtos.response.TenancyAgreementResponse;
import com.barilog.entities.InspectionStatus;
import com.barilog.entities.InspectionType;
import com.barilog.entities.TenancyStatus;
import com.barilog.models.ResidentProfile;
import com.barilog.services.ResidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
@RequiredArgsConstructor
public class ResidentController {

    private final ResidentService residentService;

    // -------------------------------------------------------------------------
    // 1. Resident Profiles & Registration (R2)
    // -------------------------------------------------------------------------

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF', 'RESIDENT')")
    public ResponseEntity<List<ResidentProfile>> getResidents(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) String allocationStatus) {
        return ResponseEntity.ok(residentService.getResidents(query, classification, allocationStatus));
    }

    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<ResidentProfile> getResidentProfile(@PathVariable Long id) {
        return ResponseEntity.ok(residentService.getResidentProfile(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ResidentProfile> registerResident(@Valid @RequestBody ResidentRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(residentService.registerResident(request));
    }

    @PutMapping("/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ResidentProfile> updateResidentProfile(
            @PathVariable Long id,
            @Valid @RequestBody ResidentRegisterRequest request) {
        return ResponseEntity.ok(residentService.updateResidentProfile(id, request));
    }

    // -------------------------------------------------------------------------
    // 2. Apartment Allocation & Move-Out Lifecycle (R2)
    // -------------------------------------------------------------------------

    @PostMapping("/{id:[0-9]+}/allocate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ResidentProfile> allocateApartment(
            @PathVariable Long id,
            @Valid @RequestBody ResidentAllocationRequest request) {
        return ResponseEntity.ok(residentService.allocateApartment(id, request));
    }

    @PostMapping("/{id:[0-9]+}/move-out")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ResidentProfile> processMoveOut(
            @PathVariable Long id,
            @RequestBody(required = false) MoveOutRequest request) {
        return ResponseEntity.ok(residentService.processMoveOut(id, request != null ? request : new MoveOutRequest()));
    }

    // -------------------------------------------------------------------------
    // 3. Tenancy Agreements (R2)
    // -------------------------------------------------------------------------

    @GetMapping("/agreements")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<List<TenancyAgreementResponse>> getTenancyAgreements(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Long residentId,
            @RequestParam(required = false) TenancyStatus status,
            @RequestParam(required = false) Boolean archived) {
        return ResponseEntity.ok(residentService.getTenancyAgreements(apartmentId, residentId, status, archived));
    }

    @GetMapping("/agreements/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<TenancyAgreementResponse> getTenancyAgreementById(@PathVariable Long id) {
        return ResponseEntity.ok(residentService.getTenancyAgreementById(id));
    }

    @PostMapping("/agreements")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TenancyAgreementResponse> createTenancyAgreement(
            @Valid @RequestBody TenancyAgreementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(residentService.createTenancyAgreement(request));
    }

    @PutMapping("/agreements/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TenancyAgreementResponse> updateTenancyAgreement(
            @PathVariable Long id,
            @Valid @RequestBody TenancyAgreementRequest request) {
        return ResponseEntity.ok(residentService.updateTenancyAgreement(id, request));
    }

    @PatchMapping("/agreements/{id:[0-9]+}/terminate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TenancyAgreementResponse> terminateTenancyAgreement(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(residentService.terminateTenancyAgreement(id, reason));
    }

    @GetMapping("/apartments/{apartmentId:[0-9]+}/agreements")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<TenancyAgreementResponse>> getApartmentTenancyHistory(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(residentService.getApartmentTenancyHistory(apartmentId));
    }

    @GetMapping("/{id:[0-9]+}/history")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'RESIDENT')")
    public ResponseEntity<List<TenancyAgreementResponse>> getResidentTenancyHistory(@PathVariable Long id) {
        return ResponseEntity.ok(residentService.getResidentTenancyHistory(id));
    }

    // -------------------------------------------------------------------------
    // 4. Move-In & Move-Out Inspections (R2)
    // -------------------------------------------------------------------------

    @GetMapping("/inspections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF', 'SECURITY')")
    public ResponseEntity<List<InspectionResponse>> getInspections(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Long residentId,
            @RequestParam(required = false) InspectionType type,
            @RequestParam(required = false) InspectionStatus status) {
        return ResponseEntity.ok(residentService.getInspections(apartmentId, residentId, type, status));
    }

    @GetMapping("/inspections/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF')")
    public ResponseEntity<InspectionResponse> getInspectionById(@PathVariable Long id) {
        return ResponseEntity.ok(residentService.getInspections(null, null, null, null).stream()
                .filter(i -> i.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new com.barilog.exceptions.ResourceNotFoundException("Inspection not found with ID: " + id)));
    }

    @PostMapping("/inspections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<InspectionResponse> scheduleInspection(
            @Valid @RequestBody InspectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(residentService.scheduleInspection(request));
    }

    @PatchMapping("/inspections/{id:[0-9]+}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'STAFF')")
    public ResponseEntity<InspectionResponse> updateInspectionStatus(
            @PathVariable Long id,
            @Valid @RequestBody InspectionStatusUpdateRequest request) {
        return ResponseEntity.ok(residentService.updateInspectionStatus(id, request));
    }

    @DeleteMapping("/inspections/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        residentService.deleteInspection(id);
        return ResponseEntity.noContent().build();
    }
}
