package com.barilog.services;

import com.barilog.dtos.request.*;
import com.barilog.dtos.response.*;
import com.barilog.entities.*;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.BuildingRuleMapper;
import com.barilog.mappers.ComplaintMapper;
import com.barilog.mappers.MaintenanceAgreementMapper;
import com.barilog.mappers.NoticeMapper;
import com.barilog.repositories.BuildingRuleRepository;
import com.barilog.repositories.ComplaintRepository;
import com.barilog.repositories.MaintenanceAgreementRepository;
import com.barilog.repositories.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Feature 03: Digital Document Repository.
 * Handles building rules, notices, complaints and maintenance agreements,
 * with role-based filtering (managers/admins see everything, residents see
 * public documents plus their own submissions).
 */
@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final int DEFAULT_REMINDER_DAYS = 30;
    private static final int MAX_REMINDER_DAYS = 365;

    private final BuildingRuleRepository buildingRuleRepository;
    private final NoticeRepository noticeRepository;
    private final ComplaintRepository complaintRepository;
    private final MaintenanceAgreementRepository maintenanceAgreementRepository;

    private final BuildingRuleMapper buildingRuleMapper;
    private final NoticeMapper noticeMapper;
    private final ComplaintMapper complaintMapper;
    private final MaintenanceAgreementMapper maintenanceAgreementMapper;

    private final AuthService authService;

    // ---------------------------------------------------------------------
    // Role helper
    // ---------------------------------------------------------------------

    private boolean isManagerOrAdmin(User user) {
        String role = user.getRole();
        return Role.MANAGER.name().equals(role) || Role.ADMIN.name().equals(role);
    }

    // ---------------------------------------------------------------------
    // Building Rules: everyone reads, managers create
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<BuildingRuleResponse> getBuildingRules() {
        return buildingRuleRepository.findAllByOrderByCategoryAscIdAsc()
                .stream()
                .map(buildingRuleMapper::toResponse)
                .toList();
    }

    @Transactional
    public BuildingRuleResponse createBuildingRule(BuildingRuleRequest request) {
        User manager = authService.getLoggedUser();

        BuildingRule rule = new BuildingRule();
        rule.setTitle(request.getTitle().trim());
        rule.setDescription(request.getDescription().trim());
        rule.setCategory(normalizeCategory(request.getCategory()));
        rule.setCreatedBy(manager);

        return buildingRuleMapper.toResponse(buildingRuleRepository.save(rule));
    }

    // ---------------------------------------------------------------------
    // Notices: everyone reads (residents only see active ones),
    // managers create and delete
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<NoticeResponse> getNotices() {
        User user = authService.getLoggedUser();
        List<Notice> notices = isManagerOrAdmin(user)
                ? noticeRepository.findAllByOrderByCreatedAtDesc()
                : noticeRepository.findActiveNotices(LocalDate.now());

        return notices.stream().map(noticeMapper::toResponse).toList();
    }

    @Transactional
    public NoticeResponse createNotice(NoticeRequest request) {
        User manager = authService.getLoggedUser();

        if (request.getExpiryDate() != null && request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Notice expiry date cannot be in the past");
        }

        Notice notice = new Notice();
        notice.setTitle(request.getTitle().trim());
        notice.setContent(request.getContent().trim());
        notice.setCategory(request.getCategory() != null ? request.getCategory() : NoticeCategory.GENERAL);
        notice.setExpiryDate(request.getExpiryDate());
        notice.setCreatedBy(manager);

        return noticeMapper.toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public void deleteNotice(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found with ID: " + id));
        noticeRepository.delete(notice);
    }

    // ---------------------------------------------------------------------
    // Complaints: residents create and view their own,
    // managers view all and resolve
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints() {
        User user = authService.getLoggedUser();
        List<Complaint> complaints = isManagerOrAdmin(user)
                ? complaintRepository.findAllByOrderByCreatedAtDesc()
                : complaintRepository.findByResidentIdOrderByCreatedAtDesc(user.getId());

        return complaints.stream().map(complaintMapper::toResponse).toList();
    }

    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request) {
        User resident = authService.getLoggedUser();

        Complaint complaint = new Complaint();
        complaint.setTitle(request.getTitle().trim());
        complaint.setDescription(request.getDescription().trim());
        complaint.setCategory(normalizeCategory(request.getCategory()));
        complaint.setStatus(ComplaintStatus.OPEN);
        complaint.setResident(resident);

        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintResponse resolveComplaint(Long id, ComplaintResolveRequest request) {
        User manager = authService.getLoggedUser();

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));

        if (complaint.getStatus() == ComplaintStatus.RESOLVED) {
            throw new IllegalArgumentException("Complaint is already resolved");
        }

        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolutionNote(request.getResolutionNote().trim());
        complaint.setResolvedBy(manager);
        complaint.setResolvedAt(Instant.now());

        return complaintMapper.toResponse(complaintRepository.save(complaint));
    }

    // ---------------------------------------------------------------------
    // Maintenance Agreements:
    //  - residents submit flat-level agreements and view their own + building-level ones
    //  - managers add building-level agreements (auto-noted), view all, and mark resident ones as noted
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<MaintenanceAgreementResponse> getMaintenanceAgreements() {
        User user = authService.getLoggedUser();
        List<MaintenanceAgreement> agreements = isManagerOrAdmin(user)
                ? maintenanceAgreementRepository.findAllByOrderByExpiryDateAsc()
                : maintenanceAgreementRepository.findVisibleToResident(user.getId());

        return agreements.stream().map(maintenanceAgreementMapper::toResponse).toList();
    }

    @Transactional
    public MaintenanceAgreementResponse createMaintenanceAgreement(MaintenanceAgreementRequest request) {
        User submitter = authService.getLoggedUser();

        if (request.getExpiryDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Expiry date must be on or after the start date");
        }

        MaintenanceAgreement agreement = new MaintenanceAgreement();
        agreement.setTitle(request.getTitle().trim());
        agreement.setVendorName(request.getVendorName().trim());
        agreement.setServiceType(request.getServiceType().trim());
        agreement.setDescription(request.getDescription());
        agreement.setStartDate(request.getStartDate());
        agreement.setExpiryDate(request.getExpiryDate());
        agreement.setSubmittedBy(submitter);

        if (isManagerOrAdmin(submitter)) {
            // Building-level contract added by management: no review needed
            agreement.setStatus(AgreementStatus.NOTED);
            agreement.setNotedBy(submitter);
            agreement.setNotedAt(Instant.now());
        } else {
            agreement.setStatus(AgreementStatus.PENDING);
        }

        return maintenanceAgreementMapper.toResponse(maintenanceAgreementRepository.save(agreement));
    }

    @Transactional
    public MaintenanceAgreementResponse markAgreementNoted(Long id) {
        User manager = authService.getLoggedUser();

        MaintenanceAgreement agreement = maintenanceAgreementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance agreement not found with ID: " + id));

        if (agreement.getStatus() == AgreementStatus.NOTED) {
            throw new IllegalArgumentException("Agreement is already marked as noted");
        }

        agreement.setStatus(AgreementStatus.NOTED);
        agreement.setNotedBy(manager);
        agreement.setNotedAt(Instant.now());

        return maintenanceAgreementMapper.toResponse(maintenanceAgreementRepository.save(agreement));
    }

    // ---------------------------------------------------------------------
    // Expiry reminders: notices and agreements expiring within N days.
    // Managers see everything; residents see notices, their own agreements and building-level ones.
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ExpiryReminderResponse getExpiryReminders(Integer days) {
        int window = (days == null || days < 1) ? DEFAULT_REMINDER_DAYS : Math.min(days, MAX_REMINDER_DAYS);
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(window);
        User user = authService.getLoggedUser();

        List<NoticeResponse> notices = noticeRepository
                .findByExpiryDateBetweenOrderByExpiryDateAsc(today, cutoff)
                .stream()
                .map(noticeMapper::toResponse)
                .toList();

        List<MaintenanceAgreement> agreements = isManagerOrAdmin(user)
                ? maintenanceAgreementRepository.findByExpiryDateLessThanEqualOrderByExpiryDateAsc(cutoff)
                : maintenanceAgreementRepository.findVisibleToResidentExpiringBy(user.getId(), cutoff);

        return new ExpiryReminderResponse(
                window,
                notices,
                agreements.stream().map(maintenanceAgreementMapper::toResponse).toList()
        );
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "GENERAL";
        }
        return category.trim().toUpperCase();
    }
}
