package com.servicedesk.vision.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "admin",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_admin_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_admin_email", columnNames = "email")
    }
)
public class AdminUser extends AppUser {

    protected AdminUser() {
    }

    public AdminUser(String username, String email, String passwordHash) {
        super(username, email, passwordHash, UserRole.ADMIN);
    }
}
