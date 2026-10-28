package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ComunicadoOficialRequestDTO;
import com.aquaica.dto.ComunicadoOficialResponseDTO;
import com.aquaica.entity.ComunicadoOficial;
import com.aquaica.repository.ComunicadoOficialRepository;

@Service
public class ComunicadoOficialService {

    private final ComunicadoOficialRepository comunicadoRepository;

    public ComunicadoOficialService(ComunicadoOficialRepository comunicadoRepository) {
        this.comunicadoRepository = comunicadoRepository;
    }

    @Transactional
    public ComunicadoOficialResponseDTO crearComunicado(ComunicadoOficialRequestDTO dto) {
        ComunicadoOficial c = new ComunicadoOficial();
        c.setTitulo(dto.getTitulo());
        c.setDescripcion(dto.getDescripcion());
        c.setEntidadEmisora(dto.getEntidadEmisora() != null ? dto.getEntidadEmisora() : "EMAPICA S.A.");
        c.setDistrito(dto.getDistrito() != null ? dto.getDistrito() : "Ica");
        c.setZonaAfectada(dto.getZonaAfectada());
        c.setTipoCorte(dto.getTipoCorte() != null ? dto.getTipoCorte() : "PROGRAMADO");
        c.setFechaInicioCorte(dto.getFechaInicioCorte());
        c.setFechaFinCorte(dto.getFechaFinCorte());
        c.setActivo(true);
        c.setFechaPublicacion(LocalDateTime.now());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            c.setCreadoPor(auth.getName());
        }

        ComunicadoOficial guardado = comunicadoRepository.save(c);
        return ComunicadoOficialResponseDTO.desdeEntidad(guardado);
    }

    public List<ComunicadoOficialResponseDTO> obtenerComunicadosActivos() {
        return comunicadoRepository.findByActivoTrueOrderByFechaPublicacionDesc()
                .stream()
                .map(ComunicadoOficialResponseDTO::desdeEntidad)
                .collect(Collectors.toList());
    }

    public List<ComunicadoOficialResponseDTO> obtenerComunicadosPorDistrito(String distrito) {
        if (distrito == null || distrito.isBlank() || "todos".equalsIgnoreCase(distrito.trim())) {
            return obtenerComunicadosActivos();
        }
        return comunicadoRepository.findActivosPorDistrito(distrito.trim())
                .stream()
                .map(ComunicadoOficialResponseDTO::desdeEntidad)
                .collect(Collectors.toList());
    }

    public List<ComunicadoOficialResponseDTO> obtenerTodosLosComunicados() {
        return comunicadoRepository.findAllByOrderByFechaPublicacionDesc()
                .stream()
                .map(ComunicadoOficialResponseDTO::desdeEntidad)
                .collect(Collectors.toList());
    }

    @Transactional
    public void desactivarComunicado(Long id) {
        ComunicadoOficial c = comunicadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comunicado oficial no encontrado"));
        c.setActivo(false);
        comunicadoRepository.save(c);
    }
}
