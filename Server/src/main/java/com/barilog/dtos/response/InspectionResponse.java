package com.barilog.dtos.response;

import com.barilog.entities.InspectionStatus;
import com.barilog.entities.InspectionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionResponse {
    private Long id;
    private Long tenancyAgreementId;
    private String agreementNumber;
    private Long apartmentId;
    private String unitNumber;
    private Long buildingId;
    private String buildingName;
    private Long residentId;
    private String residentName;
    private InspectionType inspectionType;
    private LocalDate scheduledDate;
    private String scheduledTime;
    private String inspectorName;
    private InspectionStatus status;
    private String notes;
    private String conditionReport;
    private Boolean keysHandedOver;
    private Instant completedAt;
    private Instant createdAt;
}
