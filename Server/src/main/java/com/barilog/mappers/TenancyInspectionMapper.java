package com.barilog.mappers;

import com.barilog.dtos.response.InspectionResponse;
import com.barilog.entities.TenancyInspection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TenancyInspectionMapper {

    @Mapping(target = "tenancyAgreementId", source = "tenancyAgreement.id")
    @Mapping(target = "agreementNumber", source = "tenancyAgreement.agreementNumber")
    @Mapping(target = "apartmentId", source = "apartment.id")
    @Mapping(target = "unitNumber", source = "apartment.unitNumber")
    @Mapping(target = "buildingId", source = "apartment.building.id")
    @Mapping(target = "buildingName", source = "apartment.building.name")
    @Mapping(target = "residentId", source = "resident.id")
    @Mapping(target = "residentName", source = "resident.name")
    InspectionResponse toResponse(TenancyInspection inspection);
}
