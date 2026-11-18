package com.barilog.repositories;

import com.barilog.entities.InspectionStatus;
import com.barilog.entities.InspectionType;
import com.barilog.entities.TenancyInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenancyInspectionRepository extends JpaRepository<TenancyInspection, Long>, JpaSpecificationExecutor<TenancyInspection> {

    List<TenancyInspection> findByApartmentId(Long apartmentId);

    List<TenancyInspection> findByApartmentIdOrderByScheduledDateDesc(Long apartmentId);

    List<TenancyInspection> findByResidentId(Long residentId);

    List<TenancyInspection> findByResidentIdOrderByScheduledDateDesc(Long residentId);

    List<TenancyInspection> findByTenancyAgreementId(Long tenancyAgreementId);

    List<TenancyInspection> findByStatus(InspectionStatus status);

    List<TenancyInspection> findByInspectionType(InspectionType inspectionType);

    List<TenancyInspection> findAllByOrderByScheduledDateDesc();
}
