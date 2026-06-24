package com.servicedesk.vision.auth;

import com.servicedesk.vision.auth.AuthDtos.LoginRequest;
import com.servicedesk.vision.auth.AuthDtos.SignupRequest;
import java.util.Locale;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PublicIdService publicIdService;

    public AuthService(
        AdminRepository adminRepository,
        ClientRepository clientRepository,
        EmployeeRepository employeeRepository,
        BCryptPasswordEncoder passwordEncoder,
        PublicIdService publicIdService
    ) {
        this.adminRepository = adminRepository;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.publicIdService = publicIdService;
    }

    @Transactional(readOnly = true)
    public AppUser login(LoginRequest request) {
        AppUser user = findByUsernameAndRole(request.username().trim(), request.role());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Invalid username, password, or role.");
        }

        return user;
    }

    @Transactional
    public AppUser signup(SignupRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (existsByUsernameAndRole(username, request.role())) {
            throw new AuthException("That username is already registered for this role.");
        }

        if (existsByEmail(email)) {
            throw new AuthException("That email address is already registered.");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        AppUser user = switch (request.role()) {
            case ADMIN -> adminRepository.save(new AdminUser(username, email, passwordHash));
            case CLIENT -> clientRepository.save(new ClientUser(username, email, passwordHash));
            case EMPLOYEE -> employeeRepository.save(new EmployeeUser(username, email, passwordHash));
        };
        publicIdService.assignIfMissing(user);
        return user;
    }

    private AppUser findByUsernameAndRole(String username, UserRole role) {
        return switch (role) {
            case ADMIN -> adminRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid username, password, or role."));
            case CLIENT -> clientRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid username, password, or role."));
            case EMPLOYEE -> employeeRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new AuthException("Invalid username, password, or role."));
        };
    }

    private boolean existsByUsernameAndRole(String username, UserRole role) {
        return switch (role) {
            case ADMIN -> adminRepository.existsByUsernameIgnoreCase(username);
            case CLIENT -> clientRepository.existsByUsernameIgnoreCase(username);
            case EMPLOYEE -> employeeRepository.existsByUsernameIgnoreCase(username);
        };
    }

    private boolean existsByEmail(String email) {
        return adminRepository.existsByEmailIgnoreCase(email)
            || clientRepository.existsByEmailIgnoreCase(email)
            || employeeRepository.existsByEmailIgnoreCase(email);
    }
}
