package com.barilog.repositories;

import com.barilog.entities.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Long>, JpaSpecificationExecutor<Resident> {

    List<Resident> findByResidentType(String residentType);

    @Query("SELECT r FROM Resident r WHERE " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.nidPassportNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Resident> searchResidents(@Param("query") String query);
}
