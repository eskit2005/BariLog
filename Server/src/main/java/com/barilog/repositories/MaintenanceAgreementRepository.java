package com.barilog.repositories;

import com.barilog.entities.MaintenanceAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceAgreementRepository extends JpaRepository<MaintenanceAgreement, Long> {

    List<MaintenanceAgreement> findAllByOrderByExpiryDateAsc();

    // Expired or expiring on/before the cutoff date
    List<MaintenanceAgreement> findByExpiryDateLessThanEqualOrderByExpiryDateAsc(LocalDate cutoff);

    // Resident view: their own agreements plus building-level agreements added by managers/admins
    @Query("SELECT a FROM MaintenanceAgreement a " +
           "WHERE a.submittedBy.id = :userId OR a.submittedBy.role IN ('MANAGER', 'ADMIN') " +
           "ORDER BY a.expiryDate ASC")
    List<MaintenanceAgreement> findVisibleToResident(@Param("userId") Long userId);

    @Query("SELECT a FROM MaintenanceAgreement a " +
           "WHERE (a.submittedBy.id = :userId OR a.submittedBy.role IN ('MANAGER', 'ADMIN')) " +
           "AND a.expiryDate <= :cutoff " +
           "ORDER BY a.expiryDate ASC")
    List<MaintenanceAgreement> findVisibleToResidentExpiringBy(@Param("userId") Long userId,
                                                               @Param("cutoff") LocalDate cutoff);
}
