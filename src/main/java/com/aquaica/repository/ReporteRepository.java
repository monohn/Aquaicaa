package com.aquaica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aquaica.dto.ReporteResponseDTO;
import com.aquaica.entity.Reporte;

public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    List<Reporte> findAllByOrderByFechaCreacionDesc();

    @Query("""
        SELECT r FROM Reporte r
        LEFT JOIN FETCH r.suministro s
        ORDER BY r.fechaCreacion DESC
        """)
    List<Reporte> findAllConSuministro();

    @Query("""
        SELECT new com.aquaica.dto.ReporteResponseDTO(
            r.id,
            s.codigoSuministro,
            s.nombreTitular,
            s.dni,
            s.direccion,
            s.latitud,
            s.longitud,
            r.tipoProblema,
            r.descripcion,
            r.estado,
            r.prioridad,
            r.fechaCreacion
        )
        FROM Reporte r
        LEFT JOIN r.suministro s
        ORDER BY r.fechaCreacion DESC
        """)
    List<ReporteResponseDTO> obtenerTodosLosReportes();


    @Query("""
        SELECT new com.aquaica.dto.ReporteResponseDTO(
            r.id,
            s.codigoSuministro,
            s.nombreTitular,
            s.dni,
            s.direccion,
            s.latitud,
            s.longitud,
            r.tipoProblema,
            r.descripcion,
            r.estado,
            r.prioridad,
            r.fechaCreacion
        )
        FROM Reporte r
        LEFT JOIN r.suministro s
        WHERE r.id = :id
        """)
    Optional<ReporteResponseDTO> obtenerReportePorId(Long id);

    @Query("""
    SELECT new com.aquaica.dto.ReporteResponseDTO(
        r.id,
        s.codigoSuministro,
        s.nombreTitular,
        s.dni,
        s.direccion,
        s.latitud,
        s.longitud,
        r.tipoProblema,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.fechaCreacion
    )
    FROM Reporte r
    JOIN r.suministro s
    WHERE s.codigoSuministro = :codigo
    ORDER BY r.fechaCreacion DESC
    """)
List<ReporteResponseDTO> obtenerReportesPorCodigoSuministro(String codigo);

@Query("""
    SELECT new com.aquaica.dto.ReporteResponseDTO(
        r.id,
        s.codigoSuministro,
        s.nombreTitular,
        s.dni,
        s.direccion,
        s.latitud,
        s.longitud,
        r.tipoProblema,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.fechaCreacion
    )
    FROM Reporte r
    JOIN r.suministro s
    WHERE s.dni = :dni
    ORDER BY r.fechaCreacion DESC
    """)
List<ReporteResponseDTO> obtenerReportesPorDni(String dni);

@Query("""
    SELECT new com.aquaica.dto.ReporteResponseDTO(
        r.id,
        s.codigoSuministro,
        s.nombreTitular,
        s.dni,
        s.direccion,
        s.latitud,
        s.longitud,
        r.tipoProblema,
        r.descripcion,
        r.estado,
        r.prioridad,
        r.fechaCreacion
    )
    FROM Reporte r
    JOIN r.suministro s
    WHERE s.cliente.id = :clienteId
    ORDER BY r.fechaCreacion DESC
    """)
List<ReporteResponseDTO> obtenerReportesPorClienteId(
    @Param("clienteId") Long clienteId);
}

