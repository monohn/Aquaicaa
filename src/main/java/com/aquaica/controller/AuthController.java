package com.aquaica.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.AuthRequestDTO;
import com.aquaica.dto.AuthResponseDTO;
import com.aquaica.dto.RegistroCiudadanoDTO;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.UsuarioRepository;
import com.aquaica.security.CustomUserDetails;
import com.aquaica.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthService authService, UsuarioRepository usuarioRepository) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/mi-avatar")
    public ResponseEntity<Map<String, String>> obtenerMiAvatar(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Usuario u = usuarioRepository.findById(userDetails.getUsuario().getId()).orElse(null);
        String avatar = (u != null && u.getAvatarBase64() != null) ? u.getAvatarBase64() : "";
        return ResponseEntity.ok(Map.of("avatar", avatar));
    }

    @PutMapping("/mi-avatar")
    public ResponseEntity<Map<String, String>> actualizarMiAvatar(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        if (userDetails == null || userDetails.getUsuario() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Usuario u = usuarioRepository.findById(userDetails.getUsuario().getId()).orElseThrow();
        String avatar = body != null ? body.get("avatar") : null;
        u.setAvatarBase64(avatar);
        usuarioRepository.save(u);
        return ResponseEntity.ok(Map.of("mensaje", "Foto de perfil actualizada", "avatar", avatar != null ? avatar : ""));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody AuthRequestDTO request) {

        AuthResponseDTO respuesta = authService.login(request);

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/registro-ciudadano")
public ResponseEntity<String> registrarCiudadano(
        @RequestBody RegistroCiudadanoDTO request) {

    authService.registrarCiudadano(request);

    return ResponseEntity.status(HttpStatus.CREATED)
            .body("Cuenta ciudadana creada correctamente.");
}
}