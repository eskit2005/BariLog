package com.barilog.models;

import com.barilog.entities.OccupancyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Model representing a resident's operational profile in the Tenancy Management workflow.
 * Encapsulates resident identity, classification (Owner vs Tenant), emergency contact,
 * allocated apartment unit, and active tenancy agreement state.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentProfile {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String residentType;
    private String classification; // "Owner" or "Tenant"
    private String nidPassportNumber;
    private String bloodGroup;
    private String occupation;
    private EmergencyContact emergencyContact;

    // Allocated apartment unit details (Feature 01 integration)
    private Long apartmentId;
    private String unitNumber;
    private Long buildingId;
    private String buildingName;
    private Integer floorNumber;
    private String bhkType;
    private BigDecimal sizeSqft;
    private OccupancyStatus occupancyStatus;

    // Active tenancy agreement details (Feature 02)
    private Long activeAgreementId;
    private String activeAgreementNumber;
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private LocalDate tenancyStartDate;
    private LocalDate tenancyEndDate;
    private String tenancyStatus;

    private Boolean isActive;
    private Instant createdAt;
}
