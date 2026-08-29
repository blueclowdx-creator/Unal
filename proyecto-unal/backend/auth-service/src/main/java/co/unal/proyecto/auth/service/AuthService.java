package co.unal.proyecto.auth.service;

import co.unal.proyecto.auth.domain.Usuario;
import co.unal.proyecto.auth.dto.AuthDtos.*;
import co.unal.proyecto.auth.repo.UsuarioRepository;
import co.unal.proyecto.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UsuarioRepository repo, PasswordEncoder encoder, JwtService jwt) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        Usuario u = repo.findByUsername(req.username())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));
        if (!u.isEnabled()) {
            throw new DisabledException("Usuario deshabilitado");
        }
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales inválidas");
        }
        u.setUltimoAcceso(LocalDateTime.now());
        repo.save(u);
        return buildToken(u);
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwt.parse(req.refreshToken());
        } catch (Exception e) {
            throw new BadCredentialsException("Refresh token inválido");
        }
        if (!"refresh".equals(claims.get("tipo"))) {
            throw new BadCredentialsException("No es un refresh token");
        }
        Usuario u = repo.findByUsername(claims.getSubject())
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));
        if (!u.isEnabled()) throw new DisabledException("Usuario deshabilitado");
        return buildToken(u);
    }

    public UsuarioDto me(String username) {
        Usuario u = repo.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));
        return new UsuarioDto(u.getId(), u.getUsername(), u.getEmail(),
                u.getNombreCompleto(), u.getRol(), u.isEnabled());
    }

    private TokenResponse buildToken(Usuario u) {
        String access = jwt.generateAccessToken(u.getUsername(), u.getRol());
        String refresh = jwt.generateRefreshToken(u.getUsername());
        return new TokenResponse(access, refresh, "Bearer",
                jwt.getAccessExpMin() * 60, u.getUsername(), u.getRol(), u.getNombreCompleto());
    }
}
