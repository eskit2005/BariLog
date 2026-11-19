package com.barilog.services;

import com.barilog.dtos.request.BuildingRequest;
import com.barilog.dtos.request.FloorRequest;
import com.barilog.dtos.response.BuildingResponse;
import com.barilog.dtos.response.FloorResponse;
import com.barilog.dtos.response.OccupancyStatsResponse;
import com.barilog.entities.Building;
import com.barilog.entities.Floor;
import com.barilog.entities.OccupancyStatus;
import com.barilog.entities.User;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.BuildingMapper;
import com.barilog.mappers.FloorMapper;
import com.barilog.repositories.ApartmentRepository;
import com.barilog.repositories.BuildingRepository;
import com.barilog.repositories.FloorRepository;
import com.barilog.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final BuildingMapper buildingMapper;
    private final FloorMapper floorMapper;
    private final DirectoryAccessService directoryAccess;
    private void checkSecurity(Long id) {
        User actor = directoryAccess.currentActor();
        if ("SECURITY".equals(actor.getRole())) directoryAccess.requireReadAccess(actor, id);
    }

    @Transactional
    public BuildingResponse createBuilding(BuildingRequest request) {
        if (buildingRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("A building with name '" + request.getName() + "' already exists");
        }

        Building building = new Building();
        building.setName(request.getName());
        building.setAddress(request.getAddress());
        building.setTotalFloors(request.getTotalFloors());

        User actor = directoryAccess.currentActor();
        if ("MANAGER".equals(actor.getRole()) && request.getManagerId() != null && !actor.getId().equals(request.getManagerId()))
            throw new org.springframework.security.access.AccessDeniedException("Cannot create a building for another manager");
        if (request.getManagerId() == null && "MANAGER".equals(actor.getRole())) building.setManager(actor);
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with ID: " + request.getManagerId()));
            building.setManager(manager);
        }

        Building saved = buildingRepository.save(building);
        return buildingMapper.toResponse(saved);
    }

    public BuildingResponse getBuildingById(Long id) {
        checkSecurity(id);
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + id));
        return buildingMapper.toResponse(building);
    }

    public List<BuildingResponse> getAllBuildings() {
        User actor = directoryAccess.currentActor();
        return buildingRepository.findAll().stream()
                .filter(b -> !"SECURITY".equals(actor.getRole()) || directoryAccess.canReadBuilding(actor, b))
                .map(buildingMapper::toResponse)
                .toList();
    }

    @Transactional
    public FloorResponse addFloor(Long buildingId, FloorRequest request) {
        directoryAccess.requireManagementAccess(directoryAccess.currentActor(), buildingId);
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + buildingId));

        if (request.getFloorNumber() > building.getTotalFloors() || request.getFloorNumber() < 0) {
            throw new IllegalArgumentException("Floor number " + request.getFloorNumber() + " must be between 0 and building total floors (" + building.getTotalFloors() + ")");
        }

        if (floorRepository.existsByBuildingIdAndFloorNumberAndBlockWing(buildingId, request.getFloorNumber(), request.getBlockWing())) {
            throw new DuplicateResourceException("Floor " + request.getFloorNumber() + " (" + request.getBlockWing() + ") already exists in this building");
        }

        Floor floor = new Floor();
        floor.setBuilding(building);
        floor.setFloorNumber(request.getFloorNumber());
        floor.setBlockWing(request.getBlockWing() != null ? request.getBlockWing() : "Main");
        floor.setDescription(request.getDescription());

        Floor saved = floorRepository.save(floor);
        return floorMapper.toResponse(saved);
    }

    public List<FloorResponse> getFloorsByBuilding(Long buildingId) {
        checkSecurity(buildingId);
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found with ID: " + buildingId);
        }
        return floorRepository.findByBuildingIdOrderByFloorNumberAsc(buildingId).stream()
                .map(floorMapper::toResponse)
                .toList();
    }

    public OccupancyStatsResponse getOccupancyStats(Long buildingId) {
        checkSecurity(buildingId);
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + buildingId));

        long total = apartmentRepository.countByBuildingId(buildingId);
        long vacant = apartmentRepository.countByBuildingIdAndOccupancyStatus(buildingId, OccupancyStatus.VACANT);
        long ownerOccupied = apartmentRepository.countByBuildingIdAndOccupancyStatus(buildingId, OccupancyStatus.OWNER_OCCUPIED);
        long rented = apartmentRepository.countByBuildingIdAndOccupancyStatus(buildingId, OccupancyStatus.RENTED);

        double rate = total > 0 ? ((double) (total - vacant) / total) * 100.0 : 0.0;
        // round to 1 decimal place
        rate = Math.round(rate * 10.0) / 10.0;

        return OccupancyStatsResponse.builder()
                .buildingId(buildingId)
                .buildingName(building.getName())
                .totalUnits(total)
                .vacantUnits(vacant)
                .ownerOccupiedUnits(ownerOccupied)
                .rentedUnits(rented)
                .occupancyRatePercentage(rate)
                .build();
    }
}
