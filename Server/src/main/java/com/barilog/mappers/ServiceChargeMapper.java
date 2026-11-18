package com.barilog.mappers;

import com.barilog.dtos.response.ChargeRuleResponse;
import com.barilog.dtos.response.ServiceChargeItemResponse;
import com.barilog.dtos.response.ServiceChargeResponse;
import com.barilog.entities.ChargeRule;
import com.barilog.entities.ServiceCharge;
import com.barilog.entities.ServiceChargeItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ServiceChargeMapper {

    @Mapping(source = "building.id", target = "buildingId")
    ChargeRuleResponse toRuleResponse(ChargeRule rule);

    @Mapping(source = "apartment.id", target = "apartmentId")
    @Mapping(source = "apartment.unitNumber", target = "unitNumber")
    @Mapping(source = "apartment.building.id", target = "buildingId")
    ServiceChargeResponse toChargeResponse(ServiceCharge charge);

    ServiceChargeItemResponse toItemResponse(ServiceChargeItem item);
}
