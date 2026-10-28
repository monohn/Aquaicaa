package com.aquaica.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "comunicados_oficiales")
public class ComunicadoOficial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "entidad_emisora", nullable = false, length = 100)
    private String entidadEmisora = "EMAPICA S.A.";

    @Column(nullable = false, length = 60)
    private String distrito = "Ica";

    @Column(name = "zona_afectada", length = 255)
    private String zonaAfectada;

    @Column(name = "tipo_corte", nullable = false, length = 30)
    private String tipoCorte = "PROGRAMADO";

    @Column(name = "fecha_inicio_corte")
    private LocalDateTime fechaInicioCorte;

    @Column(name = "fecha_fin_corte")
    private LocalDateTime fechaFinCorte;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_publicacion", nullable = false)
    private LocalDateTime fechaPublicacion;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    public ComunicadoOficial() {
    }

    public Long getId() {
        return id;
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

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaPublicacion() {
        return fechaPublicacion;
    }

    public void setFechaPublicacion(LocalDateTime fechaPublicacion) {
        this.fechaPublicacion = fechaPublicacion;
    }

    public String getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(String creadoPor) {
        this.creadoPor = creadoPor;
    }
}
