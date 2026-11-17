package com.barilog.entities;

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
}
