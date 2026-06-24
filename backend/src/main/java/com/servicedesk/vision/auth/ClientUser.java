package com.servicedesk.vision.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "client",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_client_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_client_email", columnNames = "email")
    }
)
public class ClientUser extends AppUser {

    protected ClientUser() {
    }

    public ClientUser(String username, String email, String passwordHash) {
        super(username, email, passwordHash, UserRole.CLIENT);
    }

    public void update(String username, String email) {
        updateProfile(username, email);
    }
}
