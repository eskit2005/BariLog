package com.barilog.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyStatsResponse {
    private Long buildingId;
    private String buildingName;
    private long totalUnits;
    private long vacantUnits;
    private long ownerOccupiedUnits;
    private long rentedUnits;
    private double occupancyRatePercentage;
}
