package com.servicedesk.vision.auth;

import com.servicedesk.vision.auth.AccountDtos.AccountResponse;
import com.servicedesk.vision.auth.AccountDtos.ClientRequest;
import com.servicedesk.vision.auth.AccountDtos.EmployeeRequest;
import com.servicedesk.vision.auth.AuthDtos.ErrorResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AccountController {

    private static final String ADMIN_CREATED_CLIENT_PASSWORD = "client@123";
    private static final String ADMIN_CREATED_EMPLOYEE_PASSWORD = "employee@123";

    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final PublicIdService publicIdService;

    public AccountController(
        ClientRepository clientRepository,
        EmployeeRepository employeeRepository,
        BCryptPasswordEncoder passwordEncoder,
        PublicIdService publicIdService
    ) {
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.publicIdService = publicIdService;
    }

    @GetMapping("/clients")
    public List<AccountResponse> getClients() {
        return clientRepository
            .findAll()
            .stream()
            .map(AccountResponse::from)
            .toList();
    }

    @GetMapping("/employees")
    public List<AccountResponse> getEmployees() {
        return employeeRepository
            .findAll()
            .stream()
            .map(AccountResponse::from)
            .toList();
    }

    @PostMapping("/clients")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse createClient(@Valid @RequestBody ClientRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (clientRepository.existsByUsernameIgnoreCase(username)) {
            throw new AuthException("That client username is already registered.");
        }

        if (clientRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("That client email is already registered.");
        }

        ClientUser client = clientRepository.save(
            new ClientUser(
                username,
                email,
                passwordEncoder.encode(ADMIN_CREATED_CLIENT_PASSWORD)
            )
        );
        publicIdService.assignIfMissing(client);
        clientRepository.save(client);
        return AccountResponse.from(client);
    }

    @PutMapping("/clients/{id}")
    public AccountResponse updateClient(
        @PathVariable Long id,
        @Valid @RequestBody ClientRequest request
    ) {
        ClientUser client = clientRepository
            .findById(id)
            .orElseThrow(() -> new AuthException("Client not found."));
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        clientRepository.findByUsernameIgnoreCase(username)
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new AuthException("That client username is already registered.");
            });

        if (clientRepository.existsByEmailIgnoreCase(email) && !client.getEmail().equalsIgnoreCase(email)) {
            throw new AuthException("That client email is already registered.");
        }

        client.update(username, email);
        return AccountResponse.from(clientRepository.save(client));
    }

    @DeleteMapping("/clients/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable Long id) {
        if (!clientRepository.existsById(id)) {
            throw new AuthException("Client not found.");
        }
        clientRepository.deleteById(id);
    }

    @PostMapping("/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse createEmployee(@Valid @RequestBody EmployeeRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String position = cleanPosition(request.position());

        if (employeeRepository.existsByUsernameIgnoreCase(username)) {
            throw new AuthException("That employee username is already registered.");
        }

        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new AuthException("That employee email is already registered.");
        }

        EmployeeUser employee = employeeRepository.save(
            new EmployeeUser(
                username,
                email,
                passwordEncoder.encode(ADMIN_CREATED_EMPLOYEE_PASSWORD),
                position
            )
        );
        publicIdService.assignIfMissing(employee);
        employeeRepository.save(employee);
        return AccountResponse.from(employee);
    }

    @PutMapping("/employees/{id}")
    public AccountResponse updateEmployee(
        @PathVariable Long id,
        @Valid @RequestBody EmployeeRequest request
    ) {
        EmployeeUser employee = employeeRepository
            .findById(id)
            .orElseThrow(() -> new AuthException("Employee not found."));
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String position = cleanPosition(request.position());

        employeeRepository.findByUsernameIgnoreCase(username)
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new AuthException("That employee username is already registered.");
            });

        if (employeeRepository.existsByEmailIgnoreCase(email) && !employee.getEmail().equalsIgnoreCase(email)) {
            throw new AuthException("That employee email is already registered.");
        }

        employee.update(username, email, position);
        return AccountResponse.from(employeeRepository.save(employee));
    }

    @DeleteMapping("/employees/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEmployee(@PathVariable Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new AuthException("Employee not found.");
        }
        employeeRepository.deleteById(id);
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException exception) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException() {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Please provide valid account details."));
    }

    private String cleanPosition(String position) {
        return position == null || position.isBlank() ? "Employee" : position.trim();
    }
}
