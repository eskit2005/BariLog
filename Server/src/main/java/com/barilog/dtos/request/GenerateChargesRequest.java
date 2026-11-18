package com.barilog.dtos.request;

/** month is written as YYYY-MM, e.g. "2026-12". */
public record GenerateChargesRequest(
        Long buildingId,
        String month
) {
}
