package com.aquaica.dto;

import java.time.Duration;
import java.time.LocalDateTime;

public class FeedItemDTO {

    private Long id;
    private String tipoItem; // "COMUNICADO_OFICIAL" o "REPORTE_VECINAL"
    private String titulo;
    private String descripcion;
    private String categoria; // "FUGA_AGUA", "CORTE_PROGRAMADO", "BAJA_PRESION", etc.
    private String distrito;
    private String ubicacionReferencia;
    private Double latitud;
    private Double longitud;
    private String estado; // "PENDIENTE", "EN_ATENCION", "RESUELTO", "VIGENTE"
    private String prioridad;
    private LocalDateTime fecha;
    private String tiempoRelativo;
    private Integer afectadosCount;
    private String imagenUrl;
    private String entidadEmisora;
    private LocalDateTime fechaInicioCorte;
    private LocalDateTime fechaFinCorte;

    public FeedItemDTO() {
    }

    public static String calcularTiempoRelativo(LocalDateTime fecha) {
        if (fecha == null) {
            return "Reciente";
        }
        Duration duration = Duration.between(fecha, LocalDateTime.now());
        long segundos = duration.getSeconds();
        if (segundos < 60) {
            return "Hace unos instantes";
        }
        long minutos = duration.toMinutes();
        if (minutos < 60) {
            return "Hace " + minutos + (minutos == 1 ? " minuto" : " minutos");
        }
        long horas = duration.toHours();
        if (horas < 24) {
            return "Hace " + horas + (horas == 1 ? " hora" : " horas");
        }
        long dias = duration.toDays();
        if (dias == 1) {
            return "Ayer";
        }
        if (dias < 7) {
            return "Hace " + dias + " días";
        }
        return "El " + fecha.getDayOfMonth() + "/" + fecha.getMonthValue() + "/" + fecha.getYear();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTipoItem() {
        return tipoItem;
    }

    public void setTipoItem(String tipoItem) {
        this.tipoItem = tipoItem;
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

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public String getUbicacionReferencia() {
        return ubicacionReferencia;
    }

    public void setUbicacionReferencia(String ubicacionReferencia) {
        this.ubicacionReferencia = ubicacionReferencia;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
        this.tiempoRelativo = calcularTiempoRelativo(fecha);
    }

    public String getTiempoRelativo() {
        return tiempoRelativo;
    }

    public void setTiempoRelativo(String tiempoRelativo) {
        this.tiempoRelativo = tiempoRelativo;
    }

    public Integer getAfectadosCount() {
        return afectadosCount;
    }

    public void setAfectadosCount(Integer afectadosCount) {
        this.afectadosCount = afectadosCount;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getEntidadEmisora() {
        return entidadEmisora;
    }

    public void setEntidadEmisora(String entidadEmisora) {
        this.entidadEmisora = entidadEmisora;
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
