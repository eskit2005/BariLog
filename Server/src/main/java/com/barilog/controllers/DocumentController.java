package com.barilog.controllers;

import com.barilog.dtos.request.*;
import com.barilog.dtos.response.*;
import com.barilog.services.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Feature 03: Digital Document Repository (Controller layer).
 *
 * Access summary:
 *  - Building Rules:  everyone reads, MANAGER/ADMIN create
 *  - Notices:         everyone reads, MANAGER/ADMIN create and delete
 *  - Complaints:      RESIDENT creates and views own, MANAGER/ADMIN view all and resolve
 *  - Maintenance:     RESIDENT submits flat agreements and views own + building-level,
 *                     MANAGER/ADMIN add building-level agreements, view all and mark noted
 *  - Expiry reminders: every logged-in user, scoped by role in the service
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // ----------------------------- Building Rules -----------------------------

    @GetMapping("/rules")
    public ResponseEntity<List<BuildingRuleResponse>> getBuildingRules() {
        return ResponseEntity.ok(documentService.getBuildingRules());
    }

    @PostMapping("/rules")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<BuildingRuleResponse> createBuildingRule(@Valid @RequestBody BuildingRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.createBuildingRule(request));
    }

    // ----------------------------- Notices -----------------------------

    @GetMapping("/notices")
    public ResponseEntity<List<NoticeResponse>> getNotices() {
        return ResponseEntity.ok(documentService.getNotices());
    }

    @PostMapping("/notices")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<NoticeResponse> createNotice(@Valid @RequestBody NoticeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.createNotice(request));
    }

    @DeleteMapping("/notices/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        documentService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    // ----------------------------- Complaints -----------------------------

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponse>> getComplaints() {
        return ResponseEntity.ok(documentService.getComplaints());
    }

    @PostMapping("/complaints")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.createComplaint(request));
    }

    @PatchMapping("/complaints/{id}/resolve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ComplaintResponse> resolveComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintResolveRequest request) {
        return ResponseEntity.ok(documentService.resolveComplaint(id, request));
    }

    // ----------------------------- Maintenance Agreements -----------------------------

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceAgreementResponse>> getMaintenanceAgreements() {
        return ResponseEntity.ok(documentService.getMaintenanceAgreements());
    }

    @PostMapping("/maintenance")
    @PreAuthorize("hasAnyRole('RESIDENT', 'MANAGER', 'ADMIN')")
    public ResponseEntity<MaintenanceAgreementResponse> createMaintenanceAgreement(
            @Valid @RequestBody MaintenanceAgreementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.createMaintenanceAgreement(request));
    }

    @PatchMapping("/maintenance/{id}/noted")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<MaintenanceAgreementResponse> markAgreementNoted(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.markAgreementNoted(id));
    }

    // ----------------------------- Expiry Reminders -----------------------------

    @GetMapping("/expiring")
    public ResponseEntity<ExpiryReminderResponse> getExpiryReminders(
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        return ResponseEntity.ok(documentService.getExpiryReminders(days));
    }
}
