package com.barilog.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "service_charges", uniqueConstraints = {
        @UniqueConstraint(name = "uq_charge_apartment_month", columnNames = {"apartment_id", "billing_month"})
})
public class ServiceCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    /** Always the first day of the billed month, e.g. 2026-12-01. */
    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ServiceChargeStatus status = ServiceChargeStatus.PENDING;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @OneToMany(mappedBy = "serviceCharge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceChargeItem> items = new ArrayList<>();
}
