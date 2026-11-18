package com.barilog.dtos.response;

import com.barilog.entities.TenancyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenancyAgreementResponse {
    private Long id;
    private String agreementNumber;
    private Long apartmentId;
    private String unitNumber;
    private Long buildingId;
    private String buildingName;
    private Long residentId;
    private String residentName;
    private String residentEmail;
    private String residentPhone;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private TenancyStatus status;
    private String paymentFrequency;
    private String terms;
    private String notes;
    private Boolean isArchived;
    private String documentReferenceId;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
}
