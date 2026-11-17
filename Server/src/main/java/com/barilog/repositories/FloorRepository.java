package com.barilog.repositories;

import com.barilog.entities.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {

    List<Floor> findByBuildingIdOrderByFloorNumberAsc(Long buildingId);

    Optional<Floor> findByBuildingIdAndFloorNumberAndBlockWing(Long buildingId, Integer floorNumber, String blockWing);

    boolean existsByBuildingIdAndFloorNumberAndBlockWing(Long buildingId, Integer floorNumber, String blockWing);
}
