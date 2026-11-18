package com.barilog.mappers;

import com.barilog.dtos.response.TenancyAgreementResponse;
import com.barilog.entities.TenancyAgreement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TenancyAgreementMapper {

    @Mapping(target = "apartmentId", source = "apartment.id")
    @Mapping(target = "unitNumber", source = "apartment.unitNumber")
    @Mapping(target = "buildingId", source = "apartment.building.id")
    @Mapping(target = "buildingName", source = "apartment.building.name")
    @Mapping(target = "residentId", source = "resident.id")
    @Mapping(target = "residentName", source = "resident.name")
    @Mapping(target = "residentEmail", source = "resident.email")
    @Mapping(target = "residentPhone", source = "resident.phoneNumber")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    TenancyAgreementResponse toResponse(TenancyAgreement agreement);
}
