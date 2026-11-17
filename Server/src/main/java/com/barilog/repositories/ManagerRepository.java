package com.barilog.repositories;

import com.barilog.entities.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Long> {

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN manager m ON u.id = m.id WHERE u.id = :id", nativeQuery = true)
    Optional<Manager> findById(@Param("id") Long id);

    @Query(value = "SELECT u.id, u.name, u.email, u.password, u.role, u.created_at FROM users u JOIN manager m ON u.id = m.id", nativeQuery = true)
    List<Manager> findAll();
}
