package com.barilog.services;

import com.barilog.dtos.request.ApartmentRequest;
import com.barilog.dtos.request.OccupancyUpdateRequest;
import com.barilog.dtos.response.ApartmentResponse;
import com.barilog.dtos.response.OccupancyHistoryResponse;
import com.barilog.entities.*;
import com.barilog.exceptions.DuplicateResourceException;
import com.barilog.exceptions.ResourceNotFoundException;
import com.barilog.mappers.ApartmentMapper;
import com.barilog.mappers.OccupancyHistoryMapper;
import com.barilog.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final UserRepository userRepository;
    private final OccupancyHistoryRepository occupancyHistoryRepository;
    private final ApartmentMapper apartmentMapper;
    private final OccupancyHistoryMapper occupancyHistoryMapper;
    private final AuthService authService;
    private final DirectoryAccessService directoryAccess;
    private final ContactVisibilityService contactVisibility;

    private ApartmentResponse response(Apartment apartment) {
        User actor = directoryAccess.currentActor();
        if ("SECURITY".equals(actor.getRole())) directoryAccess.requireReadAccess(actor, apartment.getBuilding().getId());
        return contactVisibility.redactApartment(actor, apartment, apartmentMapper.toResponse(apartment));
    }

    @Transactional
    public ApartmentResponse createApartment(ApartmentRequest request) {
        directoryAccess.requireManagementAccess(directoryAccess.currentActor(), request.getBuildingId());
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building not found with ID: " + request.getBuildingId()));

        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with ID: " + request.getFloorId()));

        if (!floor.getBuilding().getId().equals(building.getId())) {
            throw new IllegalArgumentException("Floor ID " + floor.getId() + " does not belong to Building ID " + building.getId());
        }

        if (apartmentRepository.existsByBuildingIdAndUnitNumber(building.getId(), request.getUnitNumber())) {
            throw new DuplicateResourceException("Unit '" + request.getUnitNumber() + "' already exists in building '" + building.getName() + "'");
        }

        Apartment apartment = new Apartment();
        apartment.setBuilding(building);
        apartment.setFloor(floor);
        apartment.setUnitNumber(request.getUnitNumber().trim());
        apartment.setSizeSqft(request.getSizeSqft());
        apartment.setNetCarpetSqft(request.getNetCarpetSqft());
        apartment.setBhkType(request.getBhkType());
        apartment.setNumberOfBedrooms(request.getNumberOfBedrooms() != null ? request.getNumberOfBedrooms() : 1);
        apartment.setNumberOfBathrooms(request.getNumberOfBathrooms() != null ? request.getNumberOfBathrooms() : 1);
        apartment.setNumberOfBalconies(request.getNumberOfBalconies() != null ? request.getNumberOfBalconies() : 0);
        apartment.setParkingSlotNumber(request.getParkingSlotNumber());
        apartment.setUtilityMeterNumber(request.getUtilityMeterNumber());
        apartment.setOccupancyStatus(request.getOccupancyStatus() != null ? request.getOccupancyStatus() : OccupancyStatus.VACANT);

        // Ownership
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner user not found with ID: " + request.getOwnerId()));
            apartment.setOwner(owner);
        }
        apartment.setOwnerName(request.getOwnerName());
        apartment.setOwnerPhone(request.getOwnerPhone());
        apartment.setOwnerEmail(request.getOwnerEmail());

        // Occupancy resident handling
        if (apartment.getOccupancyStatus() == OccupancyStatus.OWNER_OCCUPIED) {
            if (request.getCurrentResidentId() != null) {
                User resident = userRepository.findById(request.getCurrentResidentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + request.getCurrentResidentId()));
                apartment.setCurrentResident(resident);
            } else if (apartment.getOwner() != null) {
                apartment.setCurrentResident(apartment.getOwner());
            }
        } else if (apartment.getOccupancyStatus() == OccupancyStatus.RENTED) {
            if (request.getCurrentResidentId() != null) {
                User resident = userRepository.findById(request.getCurrentResidentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + request.getCurrentResidentId()));
                apartment.setCurrentResident(resident);
            }
        } else {
            apartment.setCurrentResident(null);
        }

        Apartment saved = apartmentRepository.save(apartment);

        // Record initial occupancy history
        User currentUser = authService.getLoggedUser();
        recordHistory(saved, "INITIAL", saved.getOccupancyStatus().name(), null, saved.getCurrentResident(), currentUser, "Initial registration of unit into building registry", LocalDate.now());

        return response(saved);
    }

    public ApartmentResponse getApartmentById(Long id) {
        Apartment apt = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + id));
        return response(apt);
    }

    public List<ApartmentResponse> getApartments(Long buildingId, Long floorId, OccupancyStatus status, Long residentId, Long ownerId) {
        User actor = directoryAccess.currentActor();
        if ("SECURITY".equals(actor.getRole())) {
            if (buildingId != null) directoryAccess.requireReadAccess(actor, buildingId);
            if (floorId != null) {
                Floor floor = floorRepository.findById(floorId).orElseThrow(() -> new ResourceNotFoundException("Floor not found"));
                directoryAccess.requireReadAccess(actor, floor.getBuilding().getId());
            }
            return apartmentRepository.findAll().stream()
                .filter(a -> directoryAccess.canReadBuilding(actor, a.getBuilding()))
                .filter(a -> buildingId == null || buildingId.equals(a.getBuilding().getId()))
                .filter(a -> floorId == null || floorId.equals(a.getFloor().getId()))
                .filter(a -> status == null || status == a.getOccupancyStatus())
                .filter(a -> residentId == null || (a.getCurrentResident() != null && residentId.equals(a.getCurrentResident().getId())))
                .filter(a -> ownerId == null || (a.getOwner() != null && ownerId.equals(a.getOwner().getId())))
                .map(this::response).toList();
        }
        List<Apartment> list;
        if (buildingId != null && status != null) {
            list = apartmentRepository.findByBuildingIdAndOccupancyStatus(buildingId, status);
        } else if (buildingId != null) {
            list = apartmentRepository.findByBuildingId(buildingId);
        } else if (floorId != null) {
            list = apartmentRepository.findByFloorId(floorId);
        } else if (status != null) {
            list = apartmentRepository.findByOccupancyStatus(status);
        } else if (residentId != null) {
            list = apartmentRepository.findByCurrentResidentId(residentId);
        } else if (ownerId != null) {
            list = apartmentRepository.findByOwnerId(ownerId);
        } else {
            list = apartmentRepository.findAll();
        }

        return list.stream()
                .map(this::response)
                .toList();
    }

    @Transactional
    public ApartmentResponse updateApartment(Long id, ApartmentRequest request) {
        Apartment apt = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + id));
        directoryAccess.requireManagementAccess(directoryAccess.currentActor(), apt.getBuilding().getId());

        apt.setSizeSqft(request.getSizeSqft());
        apt.setNetCarpetSqft(request.getNetCarpetSqft());
        apt.setBhkType(request.getBhkType());
        if (request.getNumberOfBedrooms() != null) apt.setNumberOfBedrooms(request.getNumberOfBedrooms());
        if (request.getNumberOfBathrooms() != null) apt.setNumberOfBathrooms(request.getNumberOfBathrooms());
        if (request.getNumberOfBalconies() != null) apt.setNumberOfBalconies(request.getNumberOfBalconies());
        apt.setParkingSlotNumber(request.getParkingSlotNumber());
        apt.setUtilityMeterNumber(request.getUtilityMeterNumber());

        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found with ID: " + request.getOwnerId()));
            apt.setOwner(owner);
        }
        apt.setOwnerName(request.getOwnerName());
        apt.setOwnerPhone(request.getOwnerPhone());
        apt.setOwnerEmail(request.getOwnerEmail());

        return response(apartmentRepository.save(apt));
    }

    @Transactional
    public ApartmentResponse updateOccupancyStatus(Long id, OccupancyUpdateRequest request) {
        Apartment apt = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + id));
        directoryAccess.requireManagementAccess(directoryAccess.currentActor(), apt.getBuilding().getId());

        OccupancyStatus previousStatus = apt.getOccupancyStatus();
        OccupancyStatus newStatus = request.getNewStatus();
        User previousResident = apt.getCurrentResident();
        User newResident = null;

        if (newStatus == OccupancyStatus.VACANT) {
            apt.setCurrentResident(null);
        } else if (newStatus == OccupancyStatus.OWNER_OCCUPIED) {
            if (request.getNewResidentId() != null) {
                newResident = userRepository.findById(request.getNewResidentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Resident not found with ID: " + request.getNewResidentId()));
            } else if (apt.getOwner() != null) {
                newResident = apt.getOwner();
            }
            apt.setCurrentResident(newResident);
        } else if (newStatus == OccupancyStatus.RENTED) {
            if (request.getNewResidentId() == null) {
                throw new IllegalArgumentException("A resident/tenant ID must be provided when setting occupancy to RENTED");
            }
            newResident = userRepository.findById(request.getNewResidentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resident tenant not found with ID: " + request.getNewResidentId()));
            apt.setCurrentResident(newResident);
        }

        apt.setOccupancyStatus(newStatus);
        Apartment updated = apartmentRepository.save(apt);

        User changedBy = authService.getLoggedUser();
        LocalDate effDate = request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now();
        recordHistory(updated, previousStatus.name(), newStatus.name(), previousResident, newResident, changedBy, request.getNotes(), effDate);

        return response(updated);
    }

    public List<OccupancyHistoryResponse> getOccupancyHistory(Long apartmentId) {
        User actor = directoryAccess.currentActor();
        if ("SECURITY".equals(actor.getRole())) {
            Apartment a = apartmentRepository.findById(apartmentId).orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));
            directoryAccess.requireReadAccess(actor, a.getBuilding().getId());
        }
        if (!apartmentRepository.existsById(apartmentId)) {
            throw new ResourceNotFoundException("Apartment not found with ID: " + apartmentId);
        }
        return occupancyHistoryRepository.findByApartmentIdOrderByCreatedAtDesc(apartmentId).stream()
                .map(occupancyHistoryMapper::toResponse)
                .toList();
    }

    @Transactional
    public void deleteApartment(Long id) {
        Apartment apt = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found with ID: " + id));
        directoryAccess.requireManagementAccess(directoryAccess.currentActor(), apt.getBuilding().getId());

        if (apt.getOccupancyStatus() != OccupancyStatus.VACANT) {
            throw new IllegalArgumentException("Cannot delete an occupied apartment. Please vacate the unit first.");
        }

        apartmentRepository.delete(apt);
    }

    private void recordHistory(Apartment apt, String fromStatus, String toStatus, User prevResident, User newResident, User changedBy, String notes, LocalDate date) {
        OccupancyHistory history = new OccupancyHistory();
        history.setApartment(apt);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setPreviousResident(prevResident);
        history.setNewResident(newResident);
        history.setChangedBy(changedBy);
        history.setReasonOrNotes(notes);
        history.setEffectiveDate(date);
        occupancyHistoryRepository.save(history);
    }
}
