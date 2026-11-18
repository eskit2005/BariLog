package com.barilog.services;

import com.barilog.dtos.request.ChargeRuleRequest;
import com.barilog.dtos.request.GenerateChargesRequest;
import com.barilog.dtos.response.ChargeRuleResponse;
import com.barilog.dtos.response.GenerationSummaryResponse;
import com.barilog.dtos.response.ServiceChargeResponse;
import com.barilog.entities.*;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.ServiceChargeMapper;
import com.barilog.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ServiceChargeService {

    private static final int MONEY_SCALE = 2;

    private final ChargeRuleRepository chargeRuleRepository;
    private final ServiceChargeRepository serviceChargeRepository;
    private final BuildingRepository buildingRepository;
    private final ApartmentRepository apartmentRepository;
    private final ServiceChargeMapper serviceChargeMapper;
    private final AuthService authService;

    // ------------------------------------------------------------------
    // Charge rules (configurable per building)
    // ------------------------------------------------------------------

    @Transactional
    public ChargeRuleResponse createRule(ChargeRuleRequest request) {
        if (request.buildingId() == null) {
            throw new IllegalArgumentException("buildingId is required");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Rule name is required");
        }
        if (request.ruleType() == null) {
            throw new IllegalArgumentException("Rule type is required (FIXED, PER_SQFT or SHARED_UTILITY)");
        }
        if (request.amount() == null || request.amount().signum() < 0) {
            throw new IllegalArgumentException("Amount must be zero or more");
        }

        Building building = findBuilding(request.buildingId());

        ChargeRule rule = new ChargeRule();
        rule.setBuilding(building);
        rule.setName(request.name().trim());
        rule.setRuleType(request.ruleType());
        rule.setAmount(request.amount().setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        rule.setApplyToVacant(request.applyToVacant() != null ? request.applyToVacant() : Boolean.TRUE);
        rule.setActive(true);

        return serviceChargeMapper.toRuleResponse(chargeRuleRepository.save(rule));
    }

    @Transactional(readOnly = true)
    public List<ChargeRuleResponse> getRules(Long buildingId) {
        findBuilding(buildingId);
        return chargeRuleRepository.findByBuildingIdOrderByIdAsc(buildingId).stream()
                .map(serviceChargeMapper::toRuleResponse)
                .toList();
    }

    @Transactional
    public ChargeRuleResponse setRuleActive(Long ruleId, boolean active) {
        ChargeRule rule = chargeRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Charge rule not found with ID: " + ruleId));
        rule.setActive(active);
        return serviceChargeMapper.toRuleResponse(chargeRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long ruleId) {
        ChargeRule rule = chargeRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResourceNotFoundException("Charge rule not found with ID: " + ruleId));
        // Past bills keep their own copy of the rule name/amount, so deleting is safe.
        chargeRuleRepository.delete(rule);
    }

    // ------------------------------------------------------------------
    // Monthly generation
    // ------------------------------------------------------------------

    @Transactional
    public GenerationSummaryResponse generateCharges(GenerateChargesRequest request) {
        if (request.buildingId() == null) {
            throw new IllegalArgumentException("buildingId is required");
        }
        LocalDate billingMonth = parseMonth(request.month());
        Building building = findBuilding(request.buildingId());

        List<ChargeRule> rules = chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(building.getId());
        if (rules.isEmpty()) {
            throw new IllegalArgumentException("No active charge rules are defined for building '" + building.getName() + "'. Add a rule first.");
        }

        List<Apartment> apartments = apartmentRepository.findByBuildingId(building.getId()).stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();
        if (apartments.isEmpty()) {
            throw new IllegalArgumentException("Building '" + building.getName() + "' has no apartments to bill.");
        }

        // For shared-utility rules: total area of the flats that take part in the split.
        Map<Long, BigDecimal> shareBase = new HashMap<>();
        for (ChargeRule rule : rules) {
            if (rule.getRuleType() == ChargeRuleType.SHARED_UTILITY) {
                BigDecimal base = apartments.stream()
                        .filter(a -> appliesTo(rule, a))
                        .map(Apartment::getSizeSqft)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                shareBase.put(rule.getId(), base);
            }
        }

        List<ServiceCharge> created = new ArrayList<>();
        int skipped = 0;
        BigDecimal totalBilled = BigDecimal.ZERO;

        for (Apartment apartment : apartments) {
            // Re-running the same month never creates duplicates.
            if (serviceChargeRepository.existsByApartmentIdAndBillingMonth(apartment.getId(), billingMonth)) {
                skipped++;
                continue;
            }

            ServiceCharge charge = new ServiceCharge();
            charge.setApartment(apartment);
            charge.setBillingMonth(billingMonth);
            charge.setStatus(ServiceChargeStatus.PENDING);
            charge.setGeneratedAt(Instant.now());

            BigDecimal total = BigDecimal.ZERO;
            for (ChargeRule rule : rules) {
                if (!appliesTo(rule, apartment)) {
                    continue;
                }
                BigDecimal amount = calculate(rule, apartment, shareBase.get(rule.getId()));

                ServiceChargeItem item = new ServiceChargeItem();
                item.setServiceCharge(charge);
                item.setRuleName(rule.getName());
                item.setRuleType(rule.getRuleType());
                item.setAmount(amount);
                charge.getItems().add(item);

                total = total.add(amount);
            }

            if (charge.getItems().isEmpty()) {
                skipped++;
                continue;
            }

            charge.setTotalAmount(total);
            created.add(serviceChargeRepository.save(charge));
            totalBilled = totalBilled.add(total);
        }

        List<ServiceChargeResponse> responses = created.stream()
                .map(serviceChargeMapper::toChargeResponse)
                .toList();

        return new GenerationSummaryResponse(billingMonth, created.size(), skipped, totalBilled, responses);
    }

    // ------------------------------------------------------------------
    // Reading bills
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ServiceChargeResponse> getCharges(Long buildingId, String month) {
        findBuilding(buildingId);
        List<ServiceCharge> list;
        if (month != null && !month.isBlank()) {
            list = serviceChargeRepository
                    .findByApartmentBuildingIdAndBillingMonthOrderByApartmentUnitNumberAsc(buildingId, parseMonth(month));
        } else {
            list = serviceChargeRepository
                    .findByApartmentBuildingIdOrderByBillingMonthDescApartmentUnitNumberAsc(buildingId);
        }
        return list.stream().map(serviceChargeMapper::toChargeResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceChargeResponse> getMyCharges() {
        User user = authService.getLoggedUser();
        return serviceChargeRepository.findByApartmentCurrentResidentIdOrderByBillingMonthDesc(user.getId()).stream()
                .map(serviceChargeMapper::toChargeResponse)
                .toList();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private boolean appliesTo(ChargeRule rule, Apartment apartment) {
        return Boolean.TRUE.equals(rule.getApplyToVacant())
                || apartment.getOccupancyStatus() != OccupancyStatus.VACANT;
    }

    private BigDecimal calculate(ChargeRule rule, Apartment apartment, BigDecimal shareBase) {
        BigDecimal result = switch (rule.getRuleType()) {
            case FIXED -> rule.getAmount();
            case PER_SQFT -> rule.getAmount().multiply(apartment.getSizeSqft());
            case SHARED_UTILITY -> (shareBase == null || shareBase.signum() == 0)
                    ? BigDecimal.ZERO
                    : rule.getAmount().multiply(apartment.getSizeSqft())
                            .divide(shareBase, 10, RoundingMode.HALF_UP);
        };
        return result.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private LocalDate parseMonth(String month) {
        if (month == null || month.isBlank()) {
            throw new IllegalArgumentException("month is required in YYYY-MM format, e.g. 2026-12");
        }
        try {
            return YearMonth.parse(month.trim()).atDay(1);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("month must be in YYYY-MM format, e.g. 2026-12");
        }
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + buildingId));
    }
}
