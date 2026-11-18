package com.barilog;

import com.barilog.dtos.request.GenerateChargesRequest;
import com.barilog.dtos.response.GenerationSummaryResponse;
import com.barilog.entities.*;
import com.barilog.mappers.ServiceChargeMapper;
import com.barilog.mappers.ServiceChargeMapperImpl;
import com.barilog.repositories.ApartmentRepository;
import com.barilog.repositories.BuildingRepository;
import com.barilog.repositories.ChargeRuleRepository;
import com.barilog.repositories.ServiceChargeRepository;
import com.barilog.services.AuthService;
import com.barilog.services.ServiceChargeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceChargeServiceTest {

    @Mock
    private ChargeRuleRepository chargeRuleRepository;
    @Mock
    private ServiceChargeRepository serviceChargeRepository;
    @Mock
    private BuildingRepository buildingRepository;
    @Mock
    private ApartmentRepository apartmentRepository;
    @Mock
    private AuthService authService;

    private final ServiceChargeMapper serviceChargeMapper = new ServiceChargeMapperImpl();

    private ServiceChargeService serviceChargeService;

    private Building building;

    @BeforeEach
    void setUp() {
        serviceChargeService = new ServiceChargeService(
                chargeRuleRepository,
                serviceChargeRepository,
                buildingRepository,
                apartmentRepository,
                serviceChargeMapper,
                authService
        );

        building = new Building();
        building.setId(10L);
        building.setName("Test Tower");
        building.setAddress("Test Address");
        building.setTotalFloors(3);
    }

    // ---------- helpers ----------

    private Apartment apartment(Long id, String unit, String sizeSqft, OccupancyStatus status) {
        Apartment apt = new Apartment();
        apt.setId(id);
        apt.setBuilding(building);
        apt.setUnitNumber(unit);
        apt.setSizeSqft(new BigDecimal(sizeSqft));
        apt.setOccupancyStatus(status);
        apt.setIsActive(true);
        return apt;
    }

    private ChargeRule rule(Long id, String name, ChargeRuleType type, String amount, boolean applyToVacant) {
        ChargeRule rule = new ChargeRule();
        rule.setId(id);
        rule.setBuilding(building);
        rule.setName(name);
        rule.setRuleType(type);
        rule.setAmount(new BigDecimal(amount));
        rule.setApplyToVacant(applyToVacant);
        rule.setActive(true);
        return rule;
    }

    private void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                "expected " + expected + " but was " + actual);
    }

    // ---------- tests ----------

    @Test
    void testGenerate_FixedPerSqftAndSharedUtility() {
        Apartment a1 = apartment(1L, "1A", "1000.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a2 = apartment(2L, "1B", "1500.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a3 = apartment(3L, "2A", "1200.00", OccupancyStatus.VACANT);

        List<ChargeRule> rules = List.of(
                rule(1L, "Maintenance fee", ChargeRuleType.FIXED, "500.00", true),
                rule(2L, "Common area upkeep", ChargeRuleType.PER_SQFT, "2.00", true),
                rule(3L, "Generator fuel", ChargeRuleType.SHARED_UTILITY, "3700.00", true)
        );

        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(10L)).thenReturn(rules);
        when(apartmentRepository.findByBuildingId(10L)).thenReturn(List.of(a1, a2, a3));
        when(serviceChargeRepository.existsByApartmentIdAndBillingMonth(anyLong(), any())).thenReturn(false);
        when(serviceChargeRepository.save(any(ServiceCharge.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerationSummaryResponse summary = serviceChargeService.generateCharges(
                new GenerateChargesRequest(10L, "2026-12"));

        assertEquals(LocalDate.of(2026, 12, 1), summary.billingMonth());
        assertEquals(3, summary.generatedCount());
        assertEquals(0, summary.skippedCount());

        // 1A: 500 + (1000 x 2) + (3700 x 1000/3700) = 3500
        // 1B: 500 + (1500 x 2) + (3700 x 1500/3700) = 5000
        // 2A: 500 + (1200 x 2) + (3700 x 1200/3700) = 4100
        assertAmount("3500.00", summary.charges().get(0).totalAmount());
        assertAmount("5000.00", summary.charges().get(1).totalAmount());
        assertAmount("4100.00", summary.charges().get(2).totalAmount());
        assertAmount("12600.00", summary.totalBilled());

        assertEquals("1A", summary.charges().get(0).unitNumber());
        assertEquals(3, summary.charges().get(0).items().size());
        assertEquals(ServiceChargeStatus.PENDING, summary.charges().get(0).status());
    }

    @Test
    void testGenerate_VacantFlatExcludedWhenRuleDoesNotApplyToVacant() {
        Apartment a1 = apartment(1L, "1A", "1000.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a2 = apartment(2L, "1B", "1500.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a3 = apartment(3L, "2A", "1200.00", OccupancyStatus.VACANT);

        // Vacant flat is left out, so the whole 2500 is split between 1A and 1B only
        List<ChargeRule> rules = List.of(
                rule(1L, "Water bill", ChargeRuleType.SHARED_UTILITY, "2500.00", false)
        );

        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(10L)).thenReturn(rules);
        when(apartmentRepository.findByBuildingId(10L)).thenReturn(List.of(a1, a2, a3));
        when(serviceChargeRepository.existsByApartmentIdAndBillingMonth(anyLong(), any())).thenReturn(false);
        when(serviceChargeRepository.save(any(ServiceCharge.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerationSummaryResponse summary = serviceChargeService.generateCharges(
                new GenerateChargesRequest(10L, "2026-12"));

        assertEquals(2, summary.generatedCount());
        assertEquals(1, summary.skippedCount());
        assertAmount("1000.00", summary.charges().get(0).totalAmount());
        assertAmount("1500.00", summary.charges().get(1).totalAmount());
        assertAmount("2500.00", summary.totalBilled());
        verify(serviceChargeRepository, times(2)).save(any(ServiceCharge.class));
    }

    @Test
    void testGenerate_AlreadyBilledMonthIsSkipped() {
        Apartment a1 = apartment(1L, "1A", "1000.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a2 = apartment(2L, "1B", "1500.00", OccupancyStatus.OWNER_OCCUPIED);

        List<ChargeRule> rules = List.of(
                rule(1L, "Maintenance fee", ChargeRuleType.FIXED, "500.00", true)
        );
        LocalDate month = LocalDate.of(2026, 12, 1);

        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(10L)).thenReturn(rules);
        when(apartmentRepository.findByBuildingId(10L)).thenReturn(List.of(a1, a2));
        when(serviceChargeRepository.existsByApartmentIdAndBillingMonth(1L, month)).thenReturn(true);
        when(serviceChargeRepository.existsByApartmentIdAndBillingMonth(2L, month)).thenReturn(false);
        when(serviceChargeRepository.save(any(ServiceCharge.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerationSummaryResponse summary = serviceChargeService.generateCharges(
                new GenerateChargesRequest(10L, "2026-12"));

        assertEquals(1, summary.generatedCount());
        assertEquals(1, summary.skippedCount());
        assertEquals("1B", summary.charges().get(0).unitNumber());
        verify(serviceChargeRepository, times(1)).save(any(ServiceCharge.class));
    }

    @Test
    void testGenerate_SharedUtilityRoundsToTwoDecimals() {
        Apartment a1 = apartment(1L, "1A", "1000.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a2 = apartment(2L, "1B", "1000.00", OccupancyStatus.OWNER_OCCUPIED);
        Apartment a3 = apartment(3L, "1C", "1000.00", OccupancyStatus.OWNER_OCCUPIED);

        List<ChargeRule> rules = List.of(
                rule(1L, "Electricity", ChargeRuleType.SHARED_UTILITY, "1000.00", true)
        );

        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(10L)).thenReturn(rules);
        when(apartmentRepository.findByBuildingId(10L)).thenReturn(List.of(a1, a2, a3));
        when(serviceChargeRepository.existsByApartmentIdAndBillingMonth(anyLong(), any())).thenReturn(false);
        when(serviceChargeRepository.save(any(ServiceCharge.class))).thenAnswer(inv -> inv.getArgument(0));

        GenerationSummaryResponse summary = serviceChargeService.generateCharges(
                new GenerateChargesRequest(10L, "2026-12"));

        // 1000 / 3 = 333.333... rounds to 333.33 for each flat
        assertAmount("333.33", summary.charges().get(0).totalAmount());
        assertAmount("333.33", summary.charges().get(1).totalAmount());
        assertAmount("333.33", summary.charges().get(2).totalAmount());
        assertAmount("999.99", summary.totalBilled());
    }

    @Test
    void testGenerate_NoActiveRulesThrowsException() {
        when(buildingRepository.findById(10L)).thenReturn(Optional.of(building));
        when(chargeRuleRepository.findByBuildingIdAndActiveTrueOrderByIdAsc(10L)).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class,
                () -> serviceChargeService.generateCharges(new GenerateChargesRequest(10L, "2026-12")));
        verify(serviceChargeRepository, never()).save(any());
    }

    @Test
    void testGenerate_InvalidMonthFormatThrowsException() {
        assertThrows(IllegalArgumentException.class,
                () -> serviceChargeService.generateCharges(new GenerateChargesRequest(10L, "December")));
        verify(serviceChargeRepository, never()).save(any());
    }
}
