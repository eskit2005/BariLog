package com.barilog.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GenerationSummaryResponse(
        LocalDate billingMonth,
        int generatedCount,
        int skippedCount,
        BigDecimal totalBilled,
        List<ServiceChargeResponse> charges
) {
}
