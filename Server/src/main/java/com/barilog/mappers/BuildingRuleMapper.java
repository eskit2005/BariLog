package com.barilog.mappers;

import com.barilog.dtos.response.BuildingRuleResponse;
import com.barilog.entities.BuildingRule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BuildingRuleMapper {

    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    BuildingRuleResponse toResponse(BuildingRule rule);
}
