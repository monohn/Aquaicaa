package com.aquaica.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.EvidenciaRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;

@Service
public class EvidenciaService {

    private final EvidenciaRepository evidenciaRepository;
    private final ReporteRepository reporteRepository;
    private final AsignacionRepository asignacionRepository;
    private final SeguimientoRepository seguimientoRepository;
    private final PersonalRepository personalRepository;

    private final String carpetaBase = "uploads/reportes/";

    public EvidenciaService(
            EvidenciaRepository evidenciaRepository,
            ReporteRepository reporteRepository,
            AsignacionRepository asignacionRepository,
            SeguimientoRepository seguimientoRepository,
            PersonalRepository personalRepository) {

        this.evidenciaRepository = evidenciaRepository;
        this.reporteRepository = reporteRepository;
        this.asignacionRepository = asignacionRepository;
        this.seguimientoRepository = seguimientoRepository;
        this.personalRepository = personalRepository;
    }

    public Evidencia guardarEvidencia(
            Long reporteId,
            MultipartFile archivo) throws IOException {

        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() ->
                        new RuntimeException("Reporte no encontrado"));

        Path carpetaReporte = Paths.get(
                carpetaBase + reporteId
        );

        byte[] bytes = archivo.getBytes();

        String original = archivo.getOriginalFilename();
        if (original == null || original.isBlank()) {
            original = "evidencia_" + System.currentTimeMillis() + ".jpg";
        }
        String nombreArchivo = Paths.get(original).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
        if (nombreArchivo.isBlank()) {
            nombreArchivo = "evidencia_" + System.currentTimeMillis() + ".jpg";
        }

        Path rutaArchivo = carpetaReporte.resolve(nombreArchivo);
        try {
            Files.createDirectories(carpetaReporte);
            Files.write(rutaArchivo, bytes);
        } catch (IOException ignored) {
            // En despliegues cloud efímeros se mantiene respaldo persistente en base de datos
        }

        Evidencia evidencia = new Evidencia();

        evidencia.setReporte(reporte);
        evidencia.setNombreArchivo(nombreArchivo);
        evidencia.setRutaArchivo(rutaArchivo.toString());
        evidencia.setTipoArchivo(archivo.getContentType() != null ? archivo.getContentType() : "image/jpeg");
        evidencia.setOrigen("CIUDADANO");
        evidencia.setContenidoBase64(java.util.Base64.getEncoder().encodeToString(bytes));
        evidencia.setFechaCreacion(LocalDateTime.now());

        return evidenciaRepository.save(evidencia);
    }

    public Evidencia guardarEvidenciaTecnico(
        Long reporteId,
        MultipartFile archivo,
        Long personalId) throws IOException {


    Reporte reporte = reporteRepository.findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException("Reporte no encontrado"));


    boolean asignado =
            asignacionRepository
                    .existsByReporteIdAndPersonalId(
                            reporteId,
                            personalId
                    );

    if (!asignado) {

        throw new RuntimeException(
                "El técnico no está asignado a este reporte"
        );
    }

    byte[] bytes = archivo.getBytes();
    String original = archivo.getOriginalFilename();
    if (original == null || original.isBlank()) {
        original = "evidencia_tecnico.jpg";
    }
    String limpio = Paths.get(original).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
    if (limpio.isBlank()) {
        limpio = "evidencia_tecnico.jpg";
    }

    Path carpetaReporte = Paths.get(carpetaBase + reporteId);
    String nombreFinal = "tecnico_" + System.currentTimeMillis() + "_" + limpio;
    Path rutaArchivo = carpetaReporte.resolve(nombreFinal);

    try {
        Files.createDirectories(carpetaReporte);
        Files.write(rutaArchivo, bytes);
    } catch (IOException ignored) {
        // Respaldo persistente en base de datos garantiza disponibilidad tras reinicios
    }

    Evidencia evidencia = new Evidencia();

    evidencia.setReporte(reporte);
    evidencia.setNombreArchivo(nombreFinal);
    evidencia.setRutaArchivo(rutaArchivo.toString());
    evidencia.setTipoArchivo(archivo.getContentType() != null ? archivo.getContentType() : "image/jpeg");
    evidencia.setOrigen("TECNICO");
    evidencia.setContenidoBase64(java.util.Base64.getEncoder().encodeToString(bytes));
    evidencia.setFechaCreacion(LocalDateTime.now());

    Evidencia guardada = evidenciaRepository.save(evidencia);

    // Publicar automáticamente en el historial y feed comunitario bajo Administración
    personalRepository.findById(personalId).ifPresent(personal -> {
        Seguimiento seg = new Seguimiento();
        seg.setReporte(reporte);
        seg.setPersonal(personal);
        seg.setEstado(reporte.getEstado() != null ? reporte.getEstado() : "EN_ATENCION");
        seg.setComentario("El equipo técnico en campo adjuntó nueva evidencia fotográfica de los trabajos realizados.");
        seg.setFechaCreacion(LocalDateTime.now());
        seguimientoRepository.save(seg);
    });

    return guardada;
}


    public List<EvidenciaResponseDTO> obtenerEvidenciasPorReporte(
            Long reporteId) {

        return evidenciaRepository
                .obtenerEvidenciasPorReporte(reporteId);
    }

    public List<EvidenciaResponseDTO> obtenerTodasLasEvidencias() {

    return evidenciaRepository
            .obtenerTodasLasEvidencias();
}
}