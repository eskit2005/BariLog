package com.barilog.repositories;

import com.barilog.entities.Apartment;
import com.barilog.entities.OccupancyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long>, JpaSpecificationExecutor<Apartment> {

    List<Apartment> findByBuildingId(Long buildingId);

    List<Apartment> findByFloorId(Long floorId);

    List<Apartment> findByOccupancyStatus(OccupancyStatus occupancyStatus);

    List<Apartment> findByBuildingIdAndOccupancyStatus(Long buildingId, OccupancyStatus occupancyStatus);

    List<Apartment> findByCurrentResidentId(Long residentId);

    List<Apartment> findByOwnerId(Long ownerId);

    Optional<Apartment> findByBuildingIdAndUnitNumber(Long buildingId, String unitNumber);

    boolean existsByBuildingIdAndUnitNumber(Long buildingId, String unitNumber);

    long countByBuildingId(Long buildingId);

    long countByBuildingIdAndOccupancyStatus(Long buildingId, OccupancyStatus occupancyStatus);
}
