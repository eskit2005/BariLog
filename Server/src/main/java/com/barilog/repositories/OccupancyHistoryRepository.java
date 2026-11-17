package com.barilog.repositories;

import com.barilog.entities.OccupancyHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OccupancyHistoryRepository extends JpaRepository<OccupancyHistory, Long> {

    List<OccupancyHistory> findByApartmentIdOrderByCreatedAtDesc(Long apartmentId);
}
