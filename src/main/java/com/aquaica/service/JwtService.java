
package com.aquaica.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.aquaica.entity.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    // Duración de sesión de 7 días para evitar expiraciones abruptas durante el uso
    private static final long EXPIRATION_TIME =
            1000L * 60 * 60 * 24 * 7;

    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret:AquaIca-Secret-Key-Para-JWT-2026-Seguridad-123456789}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generarToken(Usuario usuario) {

        var builder = Jwts.builder()
                .subject(usuario.getUsername())
                .claim("rol", usuario.getRol());

        if (usuario.getPersonal() != null) {
            builder.claim("personalId", usuario.getPersonal().getId());
        }

        if (usuario.getCliente() != null) {
            builder.claim("clienteId", usuario.getCliente().getId());
        }

        return builder
                .issuedAt(new Date())
                .expiration(
                        new Date(System.currentTimeMillis() + EXPIRATION_TIME)
                )
                .signWith(secretKey)
                .compact();
    }

    public String obtenerUsername(String token) {
        return obtenerClaims(token).getSubject();
    }

    public String obtenerRol(String token) {
        return obtenerClaims(token).get("rol", String.class);
    }

    public Long obtenerPersonalId(String token) {
        return obtenerClaims(token).get("personalId", Long.class);
    }

    public Long obtenerClienteId(String token) {
        return obtenerClaims(token).get("clienteId", Long.class);
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
