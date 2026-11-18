package com.barilog.dtos.response;

import com.barilog.entities.ChargeRuleType;

import java.math.BigDecimal;

public record ServiceChargeItemResponse(
        String ruleName,
        ChargeRuleType ruleType,
        BigDecimal amount
) {
}
