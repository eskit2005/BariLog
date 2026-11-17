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
@Table(name = "manager")
@DiscriminatorValue("MANAGER")
public class Manager extends User {

    @Column(name = "committee_designation", length = 100)
    private String committeeDesignation = "Building Manager";

    @Column(name = "office_room_number", length = 50)
    private String officeRoomNumber;
}
