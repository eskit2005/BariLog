package com.barilog.dtos.response;

import com.barilog.entities.ChargeRuleType;

import java.math.BigDecimal;

public record ChargeRuleResponse(
        Long id,
        Long buildingId,
        String name,
        ChargeRuleType ruleType,
        BigDecimal amount,
        Boolean applyToVacant,
        Boolean active
) {
}
