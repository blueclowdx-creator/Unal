package co.unal.proyecto.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpMin;
    private final long refreshExpHours;

    public JwtService(
            @Value("${unal.jwt.secret}") String secret,
            @Value("${unal.jwt.access-token-expiration-min}") long accessExpMin,
            @Value("${unal.jwt.refresh-token-expiration-hours}") long refreshExpHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpMin = accessExpMin;
        this.refreshExpHours = refreshExpHours;
    }

    public String generateAccessToken(String username, String rol) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .claims(Map.of("rol", rol, "tipo", "access"))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessExpMin * 60)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(username)
                .claims(Map.of("tipo", "refresh"))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(refreshExpHours * 3600)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public long getAccessExpMin() { return accessExpMin; }
    public long getRefreshExpHours() { return refreshExpHours; }
}
