package com.barilog.repositories;

import com.barilog.entities.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    List<Notice> findAllByOrderByCreatedAtDesc();

    // Notices still in force: no expiry date, or expiry today or later
    @Query("SELECT n FROM Notice n WHERE n.expiryDate IS NULL OR n.expiryDate >= :today ORDER BY n.createdAt DESC")
    List<Notice> findActiveNotices(@Param("today") LocalDate today);

    List<Notice> findByExpiryDateBetweenOrderByExpiryDateAsc(LocalDate from, LocalDate to);
}
