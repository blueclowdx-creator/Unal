-- Schema de autenticacion
CREATE SCHEMA IF NOT EXISTS unal_auth;

CREATE TABLE IF NOT EXISTS unal_auth.usuarios (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(160),
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200),
    rol VARCHAR(40) NOT NULL DEFAULT 'INVITADO',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    ultimo_acceso TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON unal_auth.usuarios(username);

-- Usuarios seed (password: "unal2024" para los tres, hasheado con BCrypt strength 10)
-- Hash generado en runtime via DataInitializer, no hardcodeado aqui
