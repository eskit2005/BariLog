package com.barilog.repositories;

import com.barilog.entities.TenancyAgreement;
import com.barilog.entities.TenancyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenancyAgreementRepository extends JpaRepository<TenancyAgreement, Long>, JpaSpecificationExecutor<TenancyAgreement> {

    Optional<TenancyAgreement> findByAgreementNumber(String agreementNumber);

    boolean existsByAgreementNumber(String agreementNumber);

    List<TenancyAgreement> findByApartmentId(Long apartmentId);

    List<TenancyAgreement> findByApartmentIdOrderByStartDateDesc(Long apartmentId);

    List<TenancyAgreement> findByResidentId(Long residentId);

    List<TenancyAgreement> findByResidentIdOrderByStartDateDesc(Long residentId);

    List<TenancyAgreement> findByStatus(TenancyStatus status);

    List<TenancyAgreement> findByIsArchived(Boolean isArchived);

    List<TenancyAgreement> findByApartmentIdAndStatusIn(Long apartmentId, Collection<TenancyStatus> statuses);

    List<TenancyAgreement> findByResidentIdAndStatusIn(Long residentId, Collection<TenancyStatus> statuses);

    Optional<TenancyAgreement> findFirstByApartmentIdAndStatusInOrderByStartDateDesc(Long apartmentId, Collection<TenancyStatus> statuses);

    Optional<TenancyAgreement> findFirstByResidentIdAndStatusInOrderByStartDateDesc(Long residentId, Collection<TenancyStatus> statuses);

    boolean existsByApartmentIdAndStatusIn(Long apartmentId, Collection<TenancyStatus> statuses);
}
