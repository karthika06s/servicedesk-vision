package com.servicedesk.vision.auth;

import com.servicedesk.vision.auth.AuthDtos.AuthResponse;
import com.servicedesk.vision.auth.AuthDtos.LoginRequest;
import com.servicedesk.vision.auth.AuthDtos.SignupRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = authService.login(request);
        JwtService.TokenResult token = jwtService.createToken(user);
        return AuthResponse.from(user, token.token(), token.expiresAt());
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        AppUser user = authService.signup(request);
        JwtService.TokenResult token = jwtService.createToken(user);
        return AuthResponse.from(user, token.token(), token.expiresAt());
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> handleAuthException(AuthException exception) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new AuthDtos.ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDtos.ErrorResponse> handleValidationException() {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new AuthDtos.ErrorResponse("Please provide valid account details."));
    }
}
