package com.barilog.repositories;
import com.barilog.entities.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ResidentRepository extends JpaRepository<Resident, Long> {}
