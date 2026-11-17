package com.barilog.entities;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "security_staff")
@DiscriminatorValue("SECURITY")
public class SecurityStaff extends User {

    @Column(name = "shift_timing", length = 50)
    private String shiftTiming;

    @Column(name = "gate_station", length = 50)
    private String gateStation;
}
