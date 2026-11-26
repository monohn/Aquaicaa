package com.aquaica.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.entity.Evidencia;
import com.aquaica.repository.EvidenciaRepository;
import com.aquaica.service.EvidenciaService;

@RestController
@RequestMapping("/api/evidencias")
public class EvidenciaArchivoController {

    private final String carpetaBase = "uploads/reportes/";

    private final EvidenciaService evidenciaService;
    private final EvidenciaRepository evidenciaRepository;

    public EvidenciaArchivoController(
            EvidenciaService evidenciaService,
            EvidenciaRepository evidenciaRepository) {

        this.evidenciaService = evidenciaService;
        this.evidenciaRepository = evidenciaRepository;
    }

    @GetMapping
    public ResponseEntity<List<EvidenciaResponseDTO>> obtenerTodasLasEvidencias() {
        return ResponseEntity.ok(evidenciaService.obtenerTodasLasEvidencias());
    }

    @GetMapping("/archivo/{reporteId}/{nombreArchivo}")
    public ResponseEntity<Resource> obtenerArchivo(
            @PathVariable Long reporteId,
            @PathVariable String nombreArchivo) {

        try {
            Path rutaArchivo = Paths.get(carpetaBase)
                    .resolve(String.valueOf(reporteId))
                    .resolve(nombreArchivo)
                    .normalize();

            Resource recurso = new UrlResource(rutaArchivo.toUri());

            if (recurso.exists() && recurso.isReadable()) {
                String tipoContenido = Files.probeContentType(rutaArchivo);
                if (tipoContenido == null) {
                    tipoContenido = MediaType.IMAGE_JPEG_VALUE;
                }
                return ResponseEntity.ok()
                        .cacheControl(CacheControl.maxAge(24, TimeUnit.HOURS).cachePublic())
                        .contentType(MediaType.parseMediaType(tipoContenido))
                        .body(recurso);
            }

            // Respaldo: redirección directa si está en Cloudinary o decodificación desde PostgreSQL
            Optional<Evidencia> evOpt = evidenciaRepository.findFirstByReporteIdAndNombreArchivo(reporteId, nombreArchivo);
            if (evOpt.isPresent()) {
                Evidencia ev = evOpt.get();
                if (ev.getRutaArchivo() != null && ev.getRutaArchivo().startsWith("http")) {
                    return ResponseEntity.status(302)
                            .location(java.net.URI.create(ev.getRutaArchivo()))
                            .build();
                }
                if (ev.getContenidoBase64() != null && !ev.getContenidoBase64().isBlank()) {
                    byte[] bytes = Base64.getDecoder().decode(ev.getContenidoBase64());
                    String tipoRaw = ev.getTipoArchivo();
                    String tipo = (tipoRaw != null && !tipoRaw.isBlank() && !tipoRaw.contains("*"))
                            ? tipoRaw
                            : MediaType.IMAGE_JPEG_VALUE;
                    MediaType mediaType;
                    try {
                        mediaType = MediaType.parseMediaType(tipo);
                    } catch (Exception ex) {
                        mediaType = MediaType.IMAGE_JPEG;
                    }
                    return ResponseEntity.ok()
                            .cacheControl(CacheControl.maxAge(24, TimeUnit.HOURS).cachePublic())
                            .contentType(mediaType)
                            .body(new ByteArrayResource(bytes));
                }
            }

            return ResponseEntity.notFound().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}