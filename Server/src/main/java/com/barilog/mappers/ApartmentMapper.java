package com.barilog.mappers;

import com.barilog.dtos.response.ApartmentResponse;
import com.barilog.entities.Apartment;
import com.barilog.entities.OccupancyStatus;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ApartmentMapper {

    @Mapping(target = "buildingId", source = "building.id")
    @Mapping(target = "buildingName", source = "building.name")
    @Mapping(target = "floorId", source = "floor.id")
    @Mapping(target = "floorNumber", source = "floor.floorNumber")
    @Mapping(target = "blockWing", source = "floor.blockWing")
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "currentResidentId", source = "currentResident.id")
    @Mapping(target = "currentResidentName", source = "currentResident.name")
    @Mapping(target = "currentResidentEmail", source = "currentResident.email")
    @Mapping(target = "currentResidentPhone", source = "currentResident.phoneNumber")
    ApartmentResponse toResponse(Apartment apartment);

    @AfterMapping
    default void populateOwnerFallback(Apartment apartment, @MappingTarget ApartmentResponse response) {
        if (apartment.getOwner() != null) {
            if (response.getOwnerName() == null) response.setOwnerName(apartment.getOwner().getName());
            if (response.getOwnerEmail() == null) response.setOwnerEmail(apartment.getOwner().getEmail());
            if (response.getOwnerPhone() == null) response.setOwnerPhone(apartment.getOwner().getPhoneNumber());
            if (response.getOwnerId() == null) response.setOwnerId(apartment.getOwner().getId());
        }
        if (apartment.getOccupancyStatus() == OccupancyStatus.OWNER_OCCUPIED) {
            if (response.getCurrentResidentId() == null && response.getOwnerId() != null) {
                response.setCurrentResidentId(response.getOwnerId());
            }
            if (response.getCurrentResidentName() == null) {
                response.setCurrentResidentName(response.getOwnerName());
            }
            if (response.getCurrentResidentPhone() == null) {
                response.setCurrentResidentPhone(response.getOwnerPhone());
            }
            if (response.getCurrentResidentEmail() == null) {
                response.setCurrentResidentEmail(response.getOwnerEmail());
            }
        }
    }
}
