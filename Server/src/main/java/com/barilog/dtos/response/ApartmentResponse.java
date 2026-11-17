package com.barilog.dtos.response;

import com.barilog.entities.OccupancyStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class ApartmentResponse {
    private Long id;
    private Long buildingId;
    private String buildingName;
    private Long floorId;
    private Integer floorNumber;
    private String blockWing;
    private String unitNumber;
    private BigDecimal sizeSqft;
    private BigDecimal netCarpetSqft;
    private String bhkType;
    private Integer numberOfBedrooms;
    private Integer numberOfBathrooms;
    private Integer numberOfBalconies;
    private String parkingSlotNumber;
    private String utilityMeterNumber;
    private OccupancyStatus occupancyStatus;

    // Owner details
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;

    // Current resident / occupant details
    private Long currentResidentId;
    private String currentResidentName;
    private String currentResidentPhone;
    private String currentResidentEmail;

    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
