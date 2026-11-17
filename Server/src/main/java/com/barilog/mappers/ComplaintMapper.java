package com.barilog.mappers;

import com.barilog.dtos.response.ComplaintResponse;
import com.barilog.entities.Complaint;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ComplaintMapper {

    @Mapping(target = "residentId", source = "resident.id")
    @Mapping(target = "residentName", source = "resident.name")
    @Mapping(target = "residentEmail", source = "resident.email")
    @Mapping(target = "resolvedById", source = "resolvedBy.id")
    @Mapping(target = "resolvedByName", source = "resolvedBy.name")
    ComplaintResponse toResponse(Complaint complaint);
}
