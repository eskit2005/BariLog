package com.barilog.dtos.request;

import com.barilog.entities.InspectionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InspectionStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private InspectionStatus status;

    private String conditionReport;

    private String notes;

    private Boolean keysHandedOver;
}
