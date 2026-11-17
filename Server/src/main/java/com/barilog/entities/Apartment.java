package com.barilog.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "apartments", uniqueConstraints = {
        @UniqueConstraint(name = "uq_building_unit", columnNames = {"building_id", "unit_number"})
})
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(name = "unit_number", nullable = false, length = 30)
    private String unitNumber;

    @Column(name = "size_sqft", nullable = false, precision = 10, scale = 2)
    private BigDecimal sizeSqft;

    @Column(name = "net_carpet_sqft", precision = 10, scale = 2)
    private BigDecimal netCarpetSqft;

    @Column(name = "bhk_type", nullable = false, length = 20)
    private String bhkType;

    @Column(name = "number_of_bedrooms", nullable = false)
    private Integer numberOfBedrooms = 1;

    @Column(name = "number_of_bathrooms", nullable = false)
    private Integer numberOfBathrooms = 1;

    @Column(name = "number_of_balconies", nullable = false)
    private Integer numberOfBalconies = 0;

    @Column(name = "parking_slot_number", length = 50)
    private String parkingSlotNumber;

    @Column(name = "utility_meter_number", length = 100)
    private String utilityMeterNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "occupancy_status", nullable = false, length = 30)
    private OccupancyStatus occupancyStatus = OccupancyStatus.VACANT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "owner_phone", length = 30)
    private String ownerPhone;

    @Column(name = "owner_email", length = 150)
    private String ownerEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_resident_id")
    private User currentResident;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", insertable = false)
    private Instant updatedAt;
}
