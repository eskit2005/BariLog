package com.barilog.dtos.request;

import com.barilog.entities.ChargeRuleType;

import java.math.BigDecimal;

public record ChargeRuleRequest(
        Long buildingId,
        String name,
        ChargeRuleType ruleType,
        BigDecimal amount,
        Boolean applyToVacant
) {
}
