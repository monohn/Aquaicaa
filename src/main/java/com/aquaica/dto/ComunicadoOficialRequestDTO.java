package com.aquaica.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ComunicadoOficialRequestDTO {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 150, message = "El título no puede superar los 150 caracteres")
    private String titulo;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @Size(max = 100, message = "La entidad emisora no puede superar los 100 caracteres")
    private String entidadEmisora = "EMAPICA S.A.";

    @NotBlank(message = "El distrito es obligatorio")
    @Size(max = 60, message = "El distrito no puede superar los 60 caracteres")
    private String distrito = "Ica";

    @Size(max = 255, message = "La zona afectada no puede superar los 255 caracteres")
    private String zonaAfectada;

    @NotBlank(message = "El tipo de corte es obligatorio")
    private String tipoCorte = "PROGRAMADO";

    private LocalDateTime fechaInicioCorte;
    private LocalDateTime fechaFinCorte;

    public ComunicadoOficialRequestDTO() {
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEntidadEmisora() {
        return entidadEmisora;
    }

    public void setEntidadEmisora(String entidadEmisora) {
        this.entidadEmisora = entidadEmisora;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public String getZonaAfectada() {
        return zonaAfectada;
    }

    public void setZonaAfectada(String zonaAfectada) {
        this.zonaAfectada = zonaAfectada;
    }

    public String getTipoCorte() {
        return tipoCorte;
    }

    public void setTipoCorte(String tipoCorte) {
        this.tipoCorte = tipoCorte;
    }

    public LocalDateTime getFechaInicioCorte() {
        return fechaInicioCorte;
    }

    public void setFechaInicioCorte(LocalDateTime fechaInicioCorte) {
        this.fechaInicioCorte = fechaInicioCorte;
    }

    public LocalDateTime getFechaFinCorte() {
        return fechaFinCorte;
    }

    public void setFechaFinCorte(LocalDateTime fechaFinCorte) {
        this.fechaFinCorte = fechaFinCorte;
    }
}
