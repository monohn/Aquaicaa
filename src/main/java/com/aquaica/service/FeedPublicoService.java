package com.aquaica.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.EvidenciaResponseDTO;
import com.aquaica.dto.FeedItemDTO;
import com.aquaica.dto.PuntoMapaDTO;
import com.aquaica.dto.SeguimientoResponseDTO;
import com.aquaica.entity.Bitacora;
import com.aquaica.entity.ComunicadoOficial;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Suministro;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.BitacoraRepository;
import com.aquaica.repository.ComunicadoOficialRepository;
import com.aquaica.repository.EvidenciaRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.repository.UsuarioRepository;

@Service
public class FeedPublicoService {

    private final ReporteRepository reporteRepository;
    private final ComunicadoOficialRepository comunicadoRepository;
    private final EvidenciaRepository evidenciaRepository;
    private final SeguimientoRepository seguimientoRepository;
    private final BitacoraRepository bitacoraRepository;
    private final UsuarioRepository usuarioRepository;

    private static final List<String> DISTRITOS_ICA = List.of(
            "Todos",
            "Ica Cercado",
            "Parcona",
            "La Tinguiña",
            "Subtanjalla",
            "Los Aquijes",
            "San Juan Bautista",
            "Pueblo Nuevo",
            "Santiago",
            "Salas Guadalupe",
            "Ocucaje",
            "Tate",
            "Pachacútec",
            "Yauca del Rosario"
    );

    public FeedPublicoService(
            ReporteRepository reporteRepository,
            ComunicadoOficialRepository comunicadoRepository,
            EvidenciaRepository evidenciaRepository,
            SeguimientoRepository seguimientoRepository,
            BitacoraRepository bitacoraRepository,
            UsuarioRepository usuarioRepository) {
        this.reporteRepository = reporteRepository;
        this.comunicadoRepository = comunicadoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.seguimientoRepository = seguimientoRepository;
        this.bitacoraRepository = bitacoraRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<String> obtenerDistritosIca() {
        return DISTRITOS_ICA;
    }

    public List<FeedItemDTO> obtenerFeed(String distritoFiltro, String categoriaFiltro, int page, int size) {
        List<FeedItemDTO> feedItems = new ArrayList<>();

        // 1. Obtener comunicados oficiales vigentes
        List<ComunicadoOficial> comunicados = comunicadoRepository.findByActivoTrueOrderByFechaPublicacionDesc();
        for (ComunicadoOficial com : comunicados) {
            String distritoCom = com.getDistrito() != null ? com.getDistrito() : "Ica";
            if (aplicaFiltroDistrito(distritoCom, distritoFiltro)) {
                if (categoriaFiltro == null || categoriaFiltro.isBlank() ||
                        "todos".equalsIgnoreCase(categoriaFiltro) ||
                        "comunicados".equalsIgnoreCase(categoriaFiltro)) {
                    feedItems.add(mapearComunicadoAFeedItem(com));
                }
            }
        }

        // 2. Obtener reportes ciudadanos recientes
        List<Reporte> reportes = reporteRepository.findAllConSuministro();
        for (Reporte rep : reportes) {
            Suministro sum = rep.getSuministroId();
            String direccion = (sum != null && sum.getDireccion() != null) ? sum.getDireccion() : "Ica";
            String distritoRep = inferirDistrito(direccion);

            if (aplicaFiltroDistrito(distritoRep, distritoFiltro)) {
                if (aplicaFiltroCategoria(rep.getTipoProblema(), categoriaFiltro)) {
                    feedItems.add(mapearReporteAFeedItem(rep, sum, distritoRep, direccion));
                }
            }
        }

        // 3. Ordenar: publicaciones y reportes con actualizaciones más recientes primero
        feedItems.sort(Comparator.comparing(
                item -> item.getFechaUltimaActualizacion() != null ? item.getFechaUltimaActualizacion() : item.getFecha(),
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        // 4. Paginación segura en memoria
        if (size <= 0) size = 10;
        if (page < 0) page = 0;
        int fromIndex = page * size;
        if (fromIndex >= feedItems.size()) {
            return List.of();
        }
        int toIndex = Math.min(fromIndex + size, feedItems.size());
        return feedItems.subList(fromIndex, toIndex);
    }

    @Transactional
    public Integer apoyarReporte(Long reporteId) {
        Reporte reporte = reporteRepository.findById(reporteId)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado"));

        int actual = reporte.getAfectadosCount();
        reporte.setAfectadosCount(actual + 1);

        // Si varios vecinos se ven afectados, aumentar la prioridad automáticamente
        int nuevoTotal = reporte.getAfectadosCount();
        if (nuevoTotal >= 5 && "BAJA".equalsIgnoreCase(reporte.getPrioridad())) {
            reporte.setPrioridad("MEDIA");
        } else if (nuevoTotal >= 10 && "MEDIA".equalsIgnoreCase(reporte.getPrioridad())) {
            reporte.setPrioridad("ALTA");
        } else if (nuevoTotal >= 20 && !"URGENTE".equalsIgnoreCase(reporte.getPrioridad())) {
            reporte.setPrioridad("URGENTE");
        }

        reporteRepository.save(reporte);
        return nuevoTotal;
    }

    public List<PuntoMapaDTO> obtenerPuntosMapa() {
        List<PuntoMapaDTO> puntos = new ArrayList<>();

        // Coordenadas base de Ica
        double baseLat = -14.0678;
        double baseLng = -75.7286;

        // Puntos de reportes activos
        List<Reporte> reportes = reporteRepository.findAllConSuministro();
        int offsetIndex = 0;
        for (Reporte rep : reportes) {
            Suministro sum = rep.getSuministroId();
            Double lat = (sum != null && sum.getLatitud() != null) ? sum.getLatitud() : null;
            Double lng = (sum != null && sum.getLongitud() != null) ? sum.getLongitud() : null;

            // Si no tiene lat/long en la DB, generar jitter leve alrededor de Ica para visualización en mapa
            if (lat == null || lng == null) {
                lat = baseLat + ((offsetIndex % 7) - 3) * 0.0045;
                lng = baseLng + (((offsetIndex * 3) % 7) - 3) * 0.0045;
            }

            String semaforo = switch (rep.getEstado().toUpperCase(Locale.ROOT)) {
                case "RESUELTO" -> "VERDE";
                case "EN_ATENCION", "ASIGNADO", "EN_PROCESO", "MEJORA_PARCIAL", "REVISION_PROGRAMADA" -> "AMARILLO";
                default -> "ROJO";
            };

            String direccion = (sum != null && sum.getDireccion() != null) ? sum.getDireccion() : "Ica";
            String distrito = inferirDistrito(direccion);

            puntos.add(new PuntoMapaDTO(
                    rep.getId(),
                    "REPORTE",
                    rep.getTipoProblema(),
                    direccion,
                    distrito,
                    lat,
                    lng,
                    rep.getEstado(),
                    rep.getPrioridad(),
                    semaforo,
                    rep.getAfectadosCount()
            ));
            offsetIndex++;
        }

        // Puntos de comunicados de corte
        List<ComunicadoOficial> comunicados = comunicadoRepository.findByActivoTrueOrderByFechaPublicacionDesc();
        for (ComunicadoOficial com : comunicados) {
            // Ubicar aproximadamente por distrito
            double[] coords = coordenadasAproximadasDistrito(com.getDistrito());
            puntos.add(new PuntoMapaDTO(
                    com.getId(),
                    "COMUNICADO",
                    com.getTitulo(),
                    com.getZonaAfectada() != null ? com.getZonaAfectada() : com.getDistrito(),
                    com.getDistrito(),
                    coords[0],
                    coords[1],
                    "ACTIVO",
                    com.getTipoCorte(),
                    "AZUL",
                    null
            ));
        }

        return puntos;
    }

    private FeedItemDTO mapearComunicadoAFeedItem(ComunicadoOficial com) {
        FeedItemDTO dto = new FeedItemDTO();
        dto.setId(com.getId());
        dto.setTipoItem("COMUNICADO_OFICIAL");
        dto.setTitulo(com.getTitulo());
        dto.setDescripcion(com.getDescripcion());
        dto.setCategoria("CORTE_OFICIAL");
        dto.setDistrito(com.getDistrito());
        dto.setUbicacionReferencia(com.getZonaAfectada() != null ? com.getZonaAfectada() : com.getDistrito());
        double[] coords = coordenadasAproximadasDistrito(com.getDistrito());
        dto.setLatitud(coords[0]);
        dto.setLongitud(coords[1]);
        dto.setEstado(Boolean.TRUE.equals(com.getActivo()) ? "VIGENTE" : "EXPIRADO");
        dto.setPrioridad(com.getTipoCorte());
        dto.setFecha(com.getFechaPublicacion());
        dto.setAfectadosCount(null);
        dto.setEntidadEmisora(com.getEntidadEmisora());
        dto.setFechaInicioCorte(com.getFechaInicioCorte());
        dto.setFechaFinCorte(com.getFechaFinCorte());
        dto.setImagenUrl(null);
        if (com.getCreadoPor() != null && !com.getCreadoPor().isBlank()) {
            usuarioRepository.findByUsername(com.getCreadoPor())
                    .map(Usuario::getAvatarBase64)
                    .ifPresent(dto::setAutorAvatar);
        }
        return dto;
    }

    private FeedItemDTO mapearReporteAFeedItem(Reporte rep, Suministro sum, String distrito, String direccion) {
        FeedItemDTO dto = new FeedItemDTO();
        dto.setId(rep.getId());
        dto.setTipoItem("REPORTE_VECINAL");
        dto.setTitulo(formatearTituloReporte(rep.getTipoProblema()));
        dto.setDescripcion(rep.getDescripcion());
        dto.setCategoria(rep.getTipoProblema());
        dto.setDistrito(distrito);
        dto.setUbicacionReferencia(direccion);
        dto.setLatitud(sum != null ? sum.getLatitud() : null);
        dto.setLongitud(sum != null ? sum.getLongitud() : null);
        dto.setEstado(rep.getEstado());
        dto.setPrioridad(rep.getPrioridad());
        dto.setFecha(rep.getFechaCreacion());
        dto.setAfectadosCount(rep.getAfectadosCount());
        dto.setEntidadEmisora(null);

        // Avatar del ciudadano autor si tiene cuenta y foto de perfil
        try {
            Usuario autorUsuario = rep.getUsuario();
            if (autorUsuario == null && sum != null && sum.getCliente() != null) {
                autorUsuario = usuarioRepository.findByClienteId(sum.getCliente().getId()).orElse(null);
            }
            if (autorUsuario != null && autorUsuario.getAvatarBase64() != null && !autorUsuario.getAvatarBase64().isBlank()) {
                dto.setAutorAvatar(autorUsuario.getAvatarBase64());
            }
        } catch (Exception ignored) {
        }

        java.time.LocalDateTime ultimaFecha = rep.getFechaCreacion();

        // Buscar imágenes de evidencia (ciudadana y técnica oficial)
        try {
            List<EvidenciaResponseDTO> evidencias = evidenciaRepository.obtenerEvidenciasPorReporte(rep.getId());
            if (evidencias != null && !evidencias.isEmpty()) {
                for (EvidenciaResponseDTO ev : evidencias) {
                    String url = "/api/evidencias/archivo/" + rep.getId() + "/" + ev.getNombreArchivo();
                    if ("TECNICO".equalsIgnoreCase(ev.getOrigen())) {
                        if (dto.getImagenTecnicoUrl() == null) {
                            dto.setImagenTecnicoUrl(url);
                        }
                    } else if (dto.getImagenUrl() == null) {
                        dto.setImagenUrl(url);
                    }
                    if (ev.getFechaCreacion() != null && (ultimaFecha == null || ev.getFechaCreacion().isAfter(ultimaFecha))) {
                        ultimaFecha = ev.getFechaCreacion();
                    }
                }
                if (dto.getImagenUrl() == null && dto.getImagenTecnicoUrl() != null) {
                    dto.setImagenUrl(dto.getImagenTecnicoUrl());
                }
            }
        } catch (Exception e) {
            dto.setImagenUrl(null);
        }

        // Cargar historial oficial publicado (seguimientos administrativos + bitácoras técnicas)
        List<FeedItemDTO.ActualizacionFeedDTO> actualizaciones = new ArrayList<>();
        try {
            List<SeguimientoResponseDTO> seguimientos = seguimientoRepository.obtenerSeguimientosPorReporte(rep.getId());
            if (seguimientos != null) {
                for (SeguimientoResponseDTO seg : seguimientos) {
                    String avatarPersonal = null;
                    if (seg.getPersonalId() != null) {
                        avatarPersonal = usuarioRepository.findByPersonalId(seg.getPersonalId())
                                .map(Usuario::getAvatarBase64)
                                .orElse(null);
                    }
                    actualizaciones.add(new FeedItemDTO.ActualizacionFeedDTO(
                            "OFICIAL",
                            seg.getEstado(),
                            seg.getComentario(),
                            "Administración AquaIca",
                            avatarPersonal,
                            seg.getFechaCreacion()
                    ));
                    if (seg.getFechaCreacion() != null && (ultimaFecha == null || seg.getFechaCreacion().isAfter(ultimaFecha))) {
                        ultimaFecha = seg.getFechaCreacion();
                    }
                }
            }
        } catch (Exception ignored) {
        }

        try {
            List<Bitacora> bitacoras = bitacoraRepository.findAllByReporteIdOrderByFechaCreacionAsc(rep.getId());
            if (bitacoras != null) {
                for (Bitacora b : bitacoras) {
                    String avatarTec = null;
                    if (b.getPersonal() != null) {
                        avatarTec = usuarioRepository.findByPersonalId(b.getPersonal().getId())
                                .map(Usuario::getAvatarBase64)
                                .orElse(null);
                    }
                    actualizaciones.add(new FeedItemDTO.ActualizacionFeedDTO(
                            "AVANCE_TECNICO",
                            rep.getEstado(),
                            b.getDescripcion(),
                            "Administración AquaIca · Equipo Técnico",
                            avatarTec,
                            b.getFechaCreacion()
                    ));
                    if (b.getFechaCreacion() != null && (ultimaFecha == null || b.getFechaCreacion().isAfter(ultimaFecha))) {
                        ultimaFecha = b.getFechaCreacion();
                    }
                }
            }
        } catch (Exception ignored) {
        }

        actualizaciones.sort(Comparator.comparing(
                FeedItemDTO.ActualizacionFeedDTO::getFecha,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));
        dto.setActualizaciones(actualizaciones);
        dto.setFechaUltimaActualizacion(ultimaFecha);

        return dto;
    }

    private String formatearTituloReporte(String tipoProblema) {
        if (tipoProblema == null) return "Incidencia de agua";
        return switch (tipoProblema.toUpperCase()) {
            case "FUGA", "FUGA_AGUA" -> "Fuga de agua en vía pública";
            case "TUBERIA_ROTA" -> "Rotura de tubería";
            case "SIN_AGUA", "SIN_SERVICIO" -> "Corte o interrupción del servicio";
            case "BAJA_PRESION" -> "Problema de baja presión";
            case "AGUA_TURBIA" -> "Agua turbia / calidad de agua";
            case "ANIEGO" -> "Aniego o colapso en la vía";
            default -> tipoProblema.replace("_", " ");
        };
    }

    private boolean aplicaFiltroDistrito(String distritoItem, String distritoFiltro) {
        if (distritoFiltro == null || distritoFiltro.isBlank() || "todos".equalsIgnoreCase(distritoFiltro.trim())) {
            return true;
        }
        if (distritoItem == null) return false;
        return distritoItem.toLowerCase().contains(distritoFiltro.trim().toLowerCase()) ||
               distritoFiltro.trim().toLowerCase().contains(distritoItem.toLowerCase());
    }

    private boolean aplicaFiltroCategoria(String tipoProblema, String categoriaFiltro) {
        if (categoriaFiltro == null || categoriaFiltro.isBlank() || "todos".equalsIgnoreCase(categoriaFiltro.trim())) {
            return true;
        }
        if ("comunicados".equalsIgnoreCase(categoriaFiltro.trim())) {
            return false; // los reportes vecinales no son comunicados
        }
        if (tipoProblema == null) return false;
        String prob = tipoProblema.toLowerCase();
        String cat = categoriaFiltro.trim().toLowerCase();
        if (cat.contains("fuga")) {
            return prob.contains("fuga") || prob.contains("tuberia") || prob.contains("aniego");
        }
        if (cat.contains("sin_agua") || cat.contains("corte")) {
            return prob.contains("sin_agua") || prob.contains("corte") || prob.contains("presion") || prob.contains("servicio");
        }
        return prob.contains(cat);
    }

    private String inferirDistrito(String direccion) {
        if (direccion == null) return "Ica";
        String lower = direccion.toLowerCase();
        if (lower.contains("parcona")) return "Parcona";
        if (lower.contains("tinguiña")) return "La Tinguiña";
        if (lower.contains("subtanjalla")) return "Subtanjalla";
        if (lower.contains("aquijes")) return "Los Aquijes";
        if (lower.contains("san juan bautista")) return "San Juan Bautista";
        if (lower.contains("pueblo nuevo")) return "Pueblo Nuevo";
        if (lower.contains("santiago")) return "Santiago";
        if (lower.contains("guadalupe") || lower.contains("salas")) return "Salas Guadalupe";
        if (lower.contains("ocucaje")) return "Ocucaje";
        if (lower.contains("tate")) return "Tate";
        if (lower.contains("pachacutec") || lower.contains("pachacútec")) return "Pachacútec";
        return "Ica Cercado";
    }

    private double[] coordenadasAproximadasDistrito(String distrito) {
        if (distrito == null) return new double[]{-14.0678, -75.7286};
        String lower = distrito.toLowerCase();
        if (lower.contains("parcona")) return new double[]{-14.0534, -75.7082};
        if (lower.contains("tinguiña")) return new double[]{-14.0412, -75.7115};
        if (lower.contains("subtanjalla")) return new double[]{-14.0195, -75.7584};
        if (lower.contains("aquijes")) return new double[]{-14.0955, -75.6908};
        if (lower.contains("san juan")) return new double[]{-14.0125, -75.7345};
        return new double[]{-14.0678, -75.7286}; // Centro de Ica
    }
}
