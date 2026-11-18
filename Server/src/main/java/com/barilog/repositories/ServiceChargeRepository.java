package com.barilog.repositories;

import com.barilog.entities.ServiceCharge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceChargeRepository extends JpaRepository<ServiceCharge, Long> {

    boolean existsByApartmentIdAndBillingMonth(Long apartmentId, LocalDate billingMonth);

    List<ServiceCharge> findByApartmentBuildingIdAndBillingMonthOrderByApartmentUnitNumberAsc(Long buildingId, LocalDate billingMonth);

    List<ServiceCharge> findByApartmentBuildingIdOrderByBillingMonthDescApartmentUnitNumberAsc(Long buildingId);

    List<ServiceCharge> findByApartmentCurrentResidentIdOrderByBillingMonthDesc(Long residentId);
}
