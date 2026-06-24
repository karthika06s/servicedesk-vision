package com.servicedesk.vision.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "employee",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_employee_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_employee_email", columnNames = "email")
    }
)
public class EmployeeUser extends AppUser {

    @Column(length = 120)
    private String position = "Employee";

    protected EmployeeUser() {
    }

    public EmployeeUser(String username, String email, String passwordHash) {
        super(username, email, passwordHash, UserRole.EMPLOYEE);
    }

    public EmployeeUser(String username, String email, String passwordHash, String position) {
        super(username, email, passwordHash, UserRole.EMPLOYEE);
        this.position = cleanPosition(position);
    }

    public String getPosition() {
        return cleanPosition(position);
    }

    public void update(String username, String email, String position) {
        updateProfile(username, email);
        this.position = cleanPosition(position);
    }

    public void normalizePosition() {
        this.position = cleanPosition(position);
    }

    private String cleanPosition(String position) {
        return position == null || position.isBlank() ? "Employee" : position.trim();
    }
}
