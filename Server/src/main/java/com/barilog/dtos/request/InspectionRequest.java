package com.barilog.dtos.request;

import com.barilog.entities.InspectionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class InspectionRequest {

    private Long tenancyAgreementId;

    @NotNull(message = "Apartment ID is required")
    private Long apartmentId;

    @NotNull(message = "Resident ID is required")
    private Long residentId;

    @NotNull(message = "Inspection type is required")
    private InspectionType inspectionType;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private String scheduledTime;

    private String inspectorName;

    private String notes;

    private String conditionReport;

    private Boolean keysHandedOver = false;
}
