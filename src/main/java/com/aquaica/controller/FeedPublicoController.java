package com.aquaica.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aquaica.dto.FeedItemDTO;
import com.aquaica.dto.PuntoMapaDTO;
import com.aquaica.service.FeedPublicoService;

@RestController
@RequestMapping("/api/public")
public class FeedPublicoController {

    private final FeedPublicoService feedPublicoService;
    private final com.aquaica.service.DniLookupService dniLookupService;

    public FeedPublicoController(
            FeedPublicoService feedPublicoService,
            com.aquaica.service.DniLookupService dniLookupService) {
        this.feedPublicoService = feedPublicoService;
        this.dniLookupService = dniLookupService;
    }

    /**
     * Valida un DNI (8 dígitos) contra el padrón AquaIca o RENIEC, o un código de suministro.
     */
    @GetMapping("/validar-identidad/{valor}")
    public ResponseEntity<Map<String, Object>> validarIdentidad(@PathVariable String valor) {
        return ResponseEntity.ok(dniLookupService.validarIdentidad(valor));
    }

    /**
     * Feed comunitario unificado estilo red social.
     * Retorna comunicados oficiales y reportes ciudadanos sanitizados (sin DNI ni nombres privados).
     */
    @GetMapping("/feed")
    public ResponseEntity<List<FeedItemDTO>> obtenerFeed(
            @RequestParam(required = false) String distrito,
            @RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(feedPublicoService.obtenerFeed(distrito, categoria, page, size));
    }

    /**
     * Puntos consolidados para el mapa interactivo (Leaflet).
     */
    @GetMapping("/feed/mapa")
    public ResponseEntity<List<PuntoMapaDTO>> obtenerPuntosMapa() {
        return ResponseEntity.ok(feedPublicoService.obtenerPuntosMapa());
    }

    /**
     * Interacción comunitaria: "¿A ti también te afecta?".
     * Incrementa el contador de personas afectadas y ajusta la prioridad automáticamente si es necesario.
     */
    @PostMapping("/reportes/{id}/apoyar")
    public ResponseEntity<Map<String, Object>> apoyarReporte(@PathVariable Long id) {
        Integer nuevoTotal = feedPublicoService.apoyarReporte(id);
        return ResponseEntity.ok(Map.of(
                "reporteId", id,
                "afectadosCount", nuevoTotal,
                "mensaje", "Gracias por confirmar. Tu apoyo ayuda a priorizar la atención técnica."
        ));
    }

    /**
     * Lista oficial de distritos de la provincia de Ica para el selector del feed.
     */
    @GetMapping("/distritos")
    public ResponseEntity<List<String>> obtenerDistritos() {
        return ResponseEntity.ok(feedPublicoService.obtenerDistritosIca());
    }
}
