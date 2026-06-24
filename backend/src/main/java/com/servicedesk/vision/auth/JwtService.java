package com.servicedesk.vision.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long expirationMinutes;

    public JwtService(
        ObjectMapper objectMapper,
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    public TokenResult createToken(AppUser user) {
        long expiresAt = Instant.now().plusSeconds(expirationMinutes * 60).toEpochMilli();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getUsername());
        claims.put("id", user.getId());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("exp", expiresAt);

        String headerPart = encodeJson(header);
        String claimsPart = encodeJson(claims);
        String signature = sign(headerPart + "." + claimsPart);
        return new TokenResult(headerPart + "." + claimsPart + "." + signature, expiresAt);
    }

    public AuthenticatedUser validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new AuthException("Invalid authentication token.");
            }

            String expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!constantTimeEquals(expectedSignature, parts[2])) {
                throw new AuthException("Invalid authentication token.");
            }

            Map<String, Object> claims = objectMapper.readValue(
                BASE64_URL_DECODER.decode(parts[1]),
                new TypeReference<>() {
                }
            );
            long expiresAt = ((Number) claims.get("exp")).longValue();
            if (expiresAt < Instant.now().toEpochMilli()) {
                throw new AuthException("Authentication token has expired.");
            }

            return new AuthenticatedUser(
                ((Number) claims.get("id")).longValue(),
                String.valueOf(claims.get("sub")),
                String.valueOf(claims.get("email")),
                UserRole.valueOf(String.valueOf(claims.get("role")))
            );
        } catch (AuthException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AuthException("Invalid authentication token.");
        }
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception exception) {
            throw new AuthException("Unable to create authentication token.");
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return BASE64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new AuthException("Unable to sign authentication token.");
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        return MessageDigestUtil.equals(
            left.getBytes(StandardCharsets.UTF_8),
            right.getBytes(StandardCharsets.UTF_8)
        );
    }

    public record TokenResult(String token, long expiresAt) {
    }

    public record AuthenticatedUser(Long id, String username, String email, UserRole role) {
    }
}
