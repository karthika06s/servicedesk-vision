package com.servicedesk.vision.auth;

import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PublicIdBackfillRunner implements ApplicationRunner {

    private final AdminRepository adminRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final PublicIdService publicIdService;

    public PublicIdBackfillRunner(
        AdminRepository adminRepository,
        ClientRepository clientRepository,
        EmployeeRepository employeeRepository,
        PublicIdService publicIdService
    ) {
        this.adminRepository = adminRepository;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.publicIdService = publicIdService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<AdminUser> admins = adminRepository.findAll();
        admins.forEach(publicIdService::assignIfMissing);
        adminRepository.saveAll(admins);

        List<ClientUser> clients = clientRepository.findAll();
        clients.forEach(publicIdService::assignIfMissing);
        clientRepository.saveAll(clients);

        List<EmployeeUser> employees = employeeRepository.findAll();
        employees.forEach(employee -> {
            publicIdService.assignIfMissing(employee);
            employee.normalizePosition();
        });
        employeeRepository.saveAll(employees);
    }
}
