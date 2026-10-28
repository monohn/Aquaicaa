package com.aquaica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.ComunicadoOficialRequestDTO;
import com.aquaica.dto.ComunicadoOficialResponseDTO;
import com.aquaica.service.ComunicadoOficialService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/comunicados")
public class ComunicadoOficialController {

    private final ComunicadoOficialService comunicadoService;

    public ComunicadoOficialController(ComunicadoOficialService comunicadoService) {
        this.comunicadoService = comunicadoService;
    }

    @PostMapping
    public ResponseEntity<ComunicadoOficialResponseDTO> crearComunicado(
            @Valid @RequestBody ComunicadoOficialRequestDTO dto) {
        return ResponseEntity.ok(comunicadoService.crearComunicado(dto));
    }

    @GetMapping("/activos")
    public ResponseEntity<List<ComunicadoOficialResponseDTO>> obtenerComunicadosActivos(
            @RequestParam(required = false) String distrito) {
        if (distrito != null && !distrito.isBlank()) {
            return ResponseEntity.ok(comunicadoService.obtenerComunicadosPorDistrito(distrito));
        }
        return ResponseEntity.ok(comunicadoService.obtenerComunicadosActivos());
    }

    @GetMapping
    public ResponseEntity<List<ComunicadoOficialResponseDTO>> obtenerTodos() {
        return ResponseEntity.ok(comunicadoService.obtenerTodosLosComunicados());
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Void> desactivarComunicado(@PathVariable Long id) {
        comunicadoService.desactivarComunicado(id);
        return ResponseEntity.noContent().build();
    }
}
