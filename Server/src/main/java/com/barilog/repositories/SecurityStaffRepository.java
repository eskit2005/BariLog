package com.barilog.repositories;

import com.barilog.entities.SecurityStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityStaffRepository extends JpaRepository<SecurityStaff, Long> {

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN security_staff ss ON u.id = ss.id WHERE u.id = :id", nativeQuery = true)
    Optional<SecurityStaff> findById(@Param("id") Long id);

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN security_staff ss ON u.id = ss.id", nativeQuery = true)
    List<SecurityStaff> findAll();
}
