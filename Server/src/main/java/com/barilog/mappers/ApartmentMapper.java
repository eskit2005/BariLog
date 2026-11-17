package com.barilog.mappers;

import com.barilog.dtos.response.ApartmentResponse;
import com.barilog.entities.Apartment;
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
            response.setOwnerName(apartment.getOwner().getName());
            response.setOwnerEmail(apartment.getOwner().getEmail());
            response.setOwnerPhone(apartment.getOwner().getPhoneNumber());
        }
    }
}
