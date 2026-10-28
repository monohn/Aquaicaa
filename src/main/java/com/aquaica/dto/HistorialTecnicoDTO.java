package com.aquaica.dto;

import java.time.LocalDateTime;

public class HistorialTecnicoDTO {

    private Long asignacionId;
    private Long reporteId;
    private String tipoProblema;
    private String descripcion;
    private String estadoReporte;
    private String estadoAsignacion;
    private String prioridad;
    private String codigoSuministro;
    private String direccion;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaResolucion;
    private String diagnostico;
    private String trabajoRealizado;
    private String resultado;
    private String observaciones;

    public HistorialTecnicoDTO() {
    }

    public HistorialTecnicoDTO(
            Long asignacionId,
            Long reporteId,
            String tipoProblema,
            String descripcion,
            String estadoReporte,
            String estadoAsignacion,
            String prioridad,
            String codigoSuministro,
            String direccion,
            LocalDateTime fechaAsignacion,
            LocalDateTime fechaResolucion,
            String diagnostico,
            String trabajoRealizado,
            String resultado,
            String observaciones) {

        this.asignacionId = asignacionId;
        this.reporteId = reporteId;
        this.tipoProblema = tipoProblema;
        this.descripcion = descripcion;
        this.estadoReporte = estadoReporte;
        this.estadoAsignacion = estadoAsignacion;
        this.prioridad = prioridad;
        this.codigoSuministro = codigoSuministro;
        this.direccion = direccion;
        this.fechaAsignacion = fechaAsignacion;
        this.fechaResolucion = fechaResolucion;
        this.diagnostico = diagnostico;
        this.trabajoRealizado = trabajoRealizado;
        this.resultado = resultado;
        this.observaciones = observaciones;
    }

    public Long getAsignacionId() {
        return asignacionId;
    }

    public void setAsignacionId(Long asignacionId) {
        this.asignacionId = asignacionId;
    }

    public Long getReporteId() {
        return reporteId;
    }

    public void setReporteId(Long reporteId) {
        this.reporteId = reporteId;
    }

    public String getTipoProblema() {
        return tipoProblema;
    }

    public void setTipoProblema(String tipoProblema) {
        this.tipoProblema = tipoProblema;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getEstadoReporte() {
        return estadoReporte;
    }

    public void setEstadoReporte(String estadoReporte) {
        this.estadoReporte = estadoReporte;
    }

    public String getEstadoAsignacion() {
        return estadoAsignacion;
    }

    public void setEstadoAsignacion(String estadoAsignacion) {
        this.estadoAsignacion = estadoAsignacion;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public String getCodigoSuministro() {
        return codigoSuministro;
    }

    public void setCodigoSuministro(String codigoSuministro) {
        this.codigoSuministro = codigoSuministro;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public void setFechaAsignacion(LocalDateTime fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }

    public LocalDateTime getFechaResolucion() {
        return fechaResolucion;
    }

    public void setFechaResolucion(LocalDateTime fechaResolucion) {
        this.fechaResolucion = fechaResolucion;
    }

    public String getDiagnostico() {
        return diagnostico;
    }

    public void setDiagnostico(String diagnostico) {
        this.diagnostico = diagnostico;
    }

    public String getTrabajoRealizado() {
        return trabajoRealizado;
    }

    public void setTrabajoRealizado(String trabajoRealizado) {
        this.trabajoRealizado = trabajoRealizado;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
