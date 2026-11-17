package com.barilog.repositories;

import com.barilog.entities.BuildingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRuleRepository extends JpaRepository<BuildingRule, Long> {

    List<BuildingRule> findAllByOrderByCategoryAscIdAsc();
}
