package com.barilog.repositories;

import com.barilog.entities.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN staff s ON u.id = s.id WHERE u.id = :id", nativeQuery = true)
    Optional<Staff> findById(@Param("id") Long id);

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN staff s ON u.id = s.id", nativeQuery = true)
    List<Staff> findAll();
}
