package com.servicedesk.vision.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AccountDtos {

    private AccountDtos() {
    }

    public record AccountResponse(
        Long id,
        String publicId,
        String username,
        String email,
        UserRole role,
        String position
    ) {
        public static AccountResponse from(AppUser user) {
            return new AccountResponse(
                user.getId(),
                user.getPublicId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user instanceof EmployeeUser employee ? employee.getPosition() : null
            );
        }
    }

    public record ClientRequest(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Email @Size(max = 160) String email
    ) {
    }

    public record EmployeeRequest(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Email @Size(max = 160) String email,
        @Size(max = 120) String position
    ) {
    }
}
