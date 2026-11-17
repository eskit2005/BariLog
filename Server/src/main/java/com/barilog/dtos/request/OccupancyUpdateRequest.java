package com.barilog.dtos.request;

import com.barilog.entities.OccupancyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OccupancyUpdateRequest {

    @NotNull(message = "New occupancy status is required (VACANT, OWNER_OCCUPIED, RENTED)")
    private OccupancyStatus newStatus;

    private Long newResidentId;

    private String notes;

    private LocalDate effectiveDate;
}
