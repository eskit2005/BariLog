package com.barilog.repositories;

import com.barilog.entities.ChargeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargeRuleRepository extends JpaRepository<ChargeRule, Long> {

    List<ChargeRule> findByBuildingIdOrderByIdAsc(Long buildingId);

    List<ChargeRule> findByBuildingIdAndActiveTrueOrderByIdAsc(Long buildingId);
}
