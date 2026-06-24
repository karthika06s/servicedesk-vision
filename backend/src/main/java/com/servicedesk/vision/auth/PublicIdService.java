package com.servicedesk.vision.auth;

import java.time.Year;
import org.springframework.stereotype.Service;

@Service
public class PublicIdService {

    private static final String PREFIX = "ST";

    private final AdminRepository adminRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;

    public PublicIdService(
        AdminRepository adminRepository,
        ClientRepository clientRepository,
        EmployeeRepository employeeRepository
    ) {
        this.adminRepository = adminRepository;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
    }

    public String nextPublicId() {
        int year = Year.now().getValue() % 100;
        int sequence = 1;
        String candidate;
        do {
            candidate = "%s-%02d-%03d".formatted(PREFIX, year, sequence);
            sequence++;
        } while (exists(candidate));
        return candidate;
    }

    public void assignIfMissing(AppUser user) {
        if (user.getPublicId() == null || user.getPublicId().isBlank()) {
            user.assignPublicId(nextPublicId());
        }
    }

    private boolean exists(String publicId) {
        return adminRepository.existsByPublicId(publicId)
            || clientRepository.existsByPublicId(publicId)
            || employeeRepository.existsByPublicId(publicId);
    }
}
