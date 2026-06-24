package com.servicedesk.vision.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotNull UserRole role
    ) {
    }

    public record SignupRequest(
        @NotBlank @Size(max = 80) String username,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 120) String password,
        @NotNull UserRole role
    ) {
    }

    public record AuthResponse(
        Long id,
        String publicId,
        String username,
        String email,
        UserRole role,
        String token,
        long expiresAt
    ) {
        public static AuthResponse from(AppUser user, String token, long expiresAt) {
            return new AuthResponse(
                user.getId(),
                user.getPublicId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                token,
                expiresAt
            );
        }
    }

    public record ErrorResponse(String message) {
    }
}
