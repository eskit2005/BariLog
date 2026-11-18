package com.barilog.dtos.response;

import com.barilog.entities.ServiceChargeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ServiceChargeResponse(
        Long id,
        Long apartmentId,
        String unitNumber,
        Long buildingId,
        LocalDate billingMonth,
        BigDecimal totalAmount,
        ServiceChargeStatus status,
        Instant generatedAt,
        List<ServiceChargeItemResponse> items
) {
}
