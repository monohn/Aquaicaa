package com.aquaica.dto;

public class PuntoMapaDTO {

    private Long id;
    private String tipoItem; // "REPORTE" o "COMUNICADO"
    private String titulo;
    private String direccion;
    private String distrito;
    private Double latitud;
    private Double longitud;
    private String estado;
    private String prioridad;
    private String colorSemafaro; // "ROJO", "AMARILLO", "VERDE", "AZUL"
    private Integer afectadosCount;

    public PuntoMapaDTO() {
    }

    public PuntoMapaDTO(Long id, String tipoItem, String titulo, String direccion, String distrito,
                        Double latitud, Double longitud, String estado, String prioridad,
                        String colorSemafaro, Integer afectadosCount) {
        this.id = id;
        this.tipoItem = tipoItem;
        this.titulo = titulo;
        this.direccion = direccion;
        this.distrito = distrito;
        this.latitud = latitud;
        this.longitud = longitud;
        this.estado = estado;
        this.prioridad = prioridad;
        this.colorSemafaro = colorSemafaro;
        this.afectadosCount = afectadosCount;
    }

    public Long getId() {
        return id;
    }

    public String getTipoItem() {
        return tipoItem;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDireccion() {
        return direccion;
    }

    public String getDistrito() {
        return distrito;
    }

    public Double getLatitud() {
        return latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public String getEstado() {
        return estado;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public String getColorSemafaro() {
        return colorSemafaro;
    }

    public Integer getAfectadosCount() {
        return afectadosCount;
    }
}
