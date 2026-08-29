package co.unal.proyecto.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(
            @NotBlank @Size(min = 3, max = 80) String username,
            @NotBlank @Size(min = 4, max = 200) String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record TokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresIn,
            String username,
            String rol,
            String nombreCompleto) {}

    public record UsuarioDto(
            Long id,
            String username,
            String email,
            String nombreCompleto,
            String rol,
            boolean enabled) {}

    public record ErrorResponse(String error, String mensaje) {}
}
