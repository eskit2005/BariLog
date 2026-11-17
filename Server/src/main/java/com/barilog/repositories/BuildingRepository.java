package com.barilog.repositories;

import com.barilog.entities.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {

    List<Building> findByManagerId(Long managerId);

    boolean existsByNameIgnoreCase(String name);
}
