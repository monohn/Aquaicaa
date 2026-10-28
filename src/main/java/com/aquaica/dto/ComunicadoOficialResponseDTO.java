package com.aquaica.dto;

import java.time.LocalDateTime;

import com.aquaica.entity.ComunicadoOficial;

public class ComunicadoOficialResponseDTO {

    private Long id;
    private String titulo;
    private String descripcion;
    private String entidadEmisora;
    private String distrito;
    private String zonaAfectada;
    private String tipoCorte;
    private LocalDateTime fechaInicioCorte;
    private LocalDateTime fechaFinCorte;
    private Boolean activo;
    private LocalDateTime fechaPublicacion;
    private String creadoPor;

    public ComunicadoOficialResponseDTO() {
    }

    public static ComunicadoOficialResponseDTO desdeEntidad(ComunicadoOficial entidad) {
        if (entidad == null) {
            return null;
        }
        ComunicadoOficialResponseDTO dto = new ComunicadoOficialResponseDTO();
        dto.id = entidad.getId();
        dto.titulo = entidad.getTitulo();
        dto.descripcion = entidad.getDescripcion();
        dto.entidadEmisora = entidad.getEntidadEmisora();
        dto.distrito = entidad.getDistrito();
        dto.zonaAfectada = entidad.getZonaAfectada();
        dto.tipoCorte = entidad.getTipoCorte();
        dto.fechaInicioCorte = entidad.getFechaInicioCorte();
        dto.fechaFinCorte = entidad.getFechaFinCorte();
        dto.activo = entidad.getActivo();
        dto.fechaPublicacion = entidad.getFechaPublicacion();
        dto.creadoPor = entidad.getCreadoPor();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getEntidadEmisora() {
        return entidadEmisora;
    }

    public String getDistrito() {
        return distrito;
    }

    public String getZonaAfectada() {
        return zonaAfectada;
    }

    public String getTipoCorte() {
        return tipoCorte;
    }

    public LocalDateTime getFechaInicioCorte() {
        return fechaInicioCorte;
    }

    public LocalDateTime getFechaFinCorte() {
        return fechaFinCorte;
    }

    public Boolean getActivo() {
        return activo;
    }

    public LocalDateTime getFechaPublicacion() {
        return fechaPublicacion;
    }

    public String getCreadoPor() {
        return creadoPor;
    }
}
