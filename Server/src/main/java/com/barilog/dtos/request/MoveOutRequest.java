package com.barilog.dtos.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class MoveOutRequest {

    private LocalDate effectiveDate;

    private String notes;

    private Boolean scheduleInspection = false;

    private String inspectorName;

    private String conditionReport;

    private Boolean keysReturned = true;
}
