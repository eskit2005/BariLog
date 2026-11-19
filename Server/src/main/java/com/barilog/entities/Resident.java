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
@Table(name = "resident")
@DiscriminatorValue("RESIDENT")
public class Resident extends User {

    @Column(name = "resident_type", length = 30)
    private String residentType = "TENANT"; // "OWNER_RESIDENT" or "TENANT"

    @Column(name = "nid_passport_number", length = 50)
    private String nidPassportNumber;

    @Column(name = "emergency_contact_name", length = 150)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 30)
    private String emergencyContactPhone;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "share_phone", nullable = false)
    private boolean sharePhone = false;

    @Column(name = "share_email", nullable = false)
    private boolean shareEmail = false;

    @Column(name = "share_emergency_contacts", nullable = false)
    private boolean shareEmergencyContacts = false;

    @Column(name = "emergency_contact_relationship", length = 50)
    private String emergencyContactRelationship;

    @Column(name = "physician_name", length = 150)
    private String physicianName;

    @Column(name = "physician_phone", length = 30)
    private String physicianPhone;
}
