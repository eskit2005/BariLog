package com.barilog.repositories;

import com.barilog.entities.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByResidentIdOrderByCreatedAtDesc(Long residentId);
}
