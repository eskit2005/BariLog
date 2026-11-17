package com.barilog.dtos.request;

import com.barilog.entities.OccupancyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApartmentRequest {

    @NotNull(message = "Building ID is required")
    private Long buildingId;

    @NotNull(message = "Floor ID is required")
    private Long floorId;

    @NotBlank(message = "Unit number is required")
    @Size(max = 30, message = "Unit number cannot exceed 30 characters")
    private String unitNumber;

    @NotNull(message = "Apartment size in sqft is required")
    @DecimalMin(value = "1.0", message = "Size in sqft must be greater than 0")
    private BigDecimal sizeSqft;

    private BigDecimal netCarpetSqft;

    @NotBlank(message = "BHK type is required (e.g., '2 BHK', '3 BHK', 'Studio')")
    @Size(max = 20, message = "BHK type cannot exceed 20 characters")
    private String bhkType;

    private Integer numberOfBedrooms = 1;
    private Integer numberOfBathrooms = 1;
    private Integer numberOfBalconies = 0;

    @Size(max = 50, message = "Parking slot cannot exceed 50 characters")
    private String parkingSlotNumber;

    @Size(max = 100, message = "Utility meter number cannot exceed 100 characters")
    private String utilityMeterNumber;

    private OccupancyStatus occupancyStatus = OccupancyStatus.VACANT;

    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;

    private Long currentResidentId;
}
