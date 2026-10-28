package com.aquaica.dto;

import java.time.LocalDateTime;

public class ReporteResponseDTO {

    private Long reporteId;
    private String codigoSuministro;
    private String nombreTitular;
    private String dni;
    private String direccion;
    private Double latitud;
    private Double longitud;
    private String tipoProblema;
    private String descripcion;
    private String estado;
    private String prioridad;
    private LocalDateTime fechaCreacion;
    private Integer afectadosCount = 1;

    public ReporteResponseDTO(
            Long reporteId,
            String codigoSuministro,
            String nombreTitular,
            String dni,
            String direccion,
            Double latitud,
            Double longitud,
            String tipoProblema,
            String descripcion,
            String estado,
            String prioridad,
            LocalDateTime fechaCreacion) {

        this(reporteId, codigoSuministro, nombreTitular, dni, direccion, latitud, longitud,
             tipoProblema, descripcion, estado, prioridad, fechaCreacion, 1);
    }

    public ReporteResponseDTO(
            Long reporteId,
            String codigoSuministro,
            String nombreTitular,
            String dni,
            String direccion,
            Double latitud,
            Double longitud,
            String tipoProblema,
            String descripcion,
            String estado,
            String prioridad,
            LocalDateTime fechaCreacion,
            Integer afectadosCount) {

        this.reporteId = reporteId;
        this.codigoSuministro = codigoSuministro;
        this.nombreTitular = nombreTitular;
        this.dni = dni;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.estado = estado;
        this.prioridad = prioridad;
        this.fechaCreacion = fechaCreacion;
        this.afectadosCount = afectadosCount != null ? afectadosCount : 1;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public String getCodigoSuministro() {
        return codigoSuministro;
    }

    public String getNombreTitular() {
        return nombreTitular;
    }

    public String getDni() {
        return dni;
    }

    public String getDireccion() {
        return direccion;
    }

    public Double getLatitud() {
        return latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public String getTipoProblema() {
        return tipoProblema;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getEstado() {
        return estado;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public Integer getAfectadosCount() {
        return afectadosCount != null ? afectadosCount : 1;
    }

    public void setAfectadosCount(Integer afectadosCount) {
        this.afectadosCount = afectadosCount != null ? afectadosCount : 1;
    }
}