package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.ReporteResponseDTO;
import com.aquaica.entity.Cliente;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Seguimiento;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SeguimientoRepository;
import com.aquaica.repository.SuministroRepository;
import com.aquaica.security.CustomUserDetails;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final SuministroRepository suministroRepository;
    private final SuministroService suministroService;
    private final PrioridadService prioridadService;
    private final SeguimientoRepository seguimientoRepository;
    private final PersonalRepository personalRepository;
    private final ClienteRepository clienteRepository;
    private final DniLookupService dniLookupService;

    public ReporteService(
            ReporteRepository reporteRepository,
            SuministroRepository suministroRepository,
            SuministroService suministroService,
            PrioridadService prioridadService,
            SeguimientoRepository seguimientoRepository,
            PersonalRepository personalRepository,
            ClienteRepository clienteRepository,
            DniLookupService dniLookupService) {

        this.reporteRepository = reporteRepository;
        this.suministroRepository = suministroRepository;
        this.suministroService = suministroService;
        this.prioridadService = prioridadService;
        this.seguimientoRepository = seguimientoRepository;
        this.personalRepository = personalRepository;
        this.clienteRepository = clienteRepository;
        this.dniLookupService = dniLookupService;
    }

    public Reporte crearReporte(
            String codigoSuministro,
            String tipoProblema,
            String descripcion) {

        return crearReporte(codigoSuministro, tipoProblema, descripcion, null, null, null, null);
    }

    public Reporte crearReporte(
            String codigoSuministro,
            String tipoProblema,
            String descripcion,
            Double latitud,
            Double longitud) {

        return crearReporte(codigoSuministro, tipoProblema, descripcion, latitud, longitud, null, null);
    }

    @Transactional
    public Reporte crearReporte(
            String codigoSuministro,
            String tipoProblema,
            String descripcion,
            Double latitud,
            Double longitud,
            String nombreTitularParam,
            String direccionParam) {

        String valor = codigoSuministro != null ? codigoSuministro.trim() : "00000000";

        Suministro suministro = suministroService.buscarPorCodigo(valor)
                .or(() -> suministroRepository.findByCodigoSuministro(valor))
                .orElseGet(() -> {
                    if ("00000000".equals(valor)) {
                        return suministroRepository.findByCodigoSuministro("00000000")
                                .orElseGet(() -> crearSuministroParaCiudadano(
                                        "00000000", "00000000", "Incidencia Vecinal / Vía Pública",
                                        direccionParam, latitud, longitud));
                    }

                    if (valor.matches("\\d{8}")) {
                        String nombreResuelto = (nombreTitularParam != null && !nombreTitularParam.isBlank())
                                ? nombreTitularParam.trim()
                                : null;
                        String dirResuelta = (direccionParam != null && !direccionParam.isBlank())
                                ? direccionParam.trim()
                                : null;

                        if (nombreResuelto == null) {
                            java.util.Map<String, Object> lookup = dniLookupService.validarIdentidad(valor);
                            Object nomObj = lookup.get("nombreCompleto");
                            Object dirObj = lookup.get("direccion");
                            if (nomObj != null && !String.valueOf(nomObj).isBlank()) {
                                nombreResuelto = String.valueOf(nomObj);
                            }
                            if (dirResuelta == null && dirObj != null && !String.valueOf(dirObj).isBlank()) {
                                dirResuelta = String.valueOf(dirObj);
                            }
                        }

                        if (nombreResuelto == null || nombreResuelto.isBlank()) {
                            nombreResuelto = "Ciudadano DNI " + valor;
                        }
                        return crearSuministroParaCiudadano(
                                valor, valor, nombreResuelto, dirResuelta, latitud, longitud);
                    }

                    throw new RuntimeException("No se encontró el suministro o DNI especificado.");
                });

        // Si se reciben coordenadas satelitales GPS exactas o dirección nueva, actualizar ubicación real
        boolean actualizarSum = false;
        if (latitud != null && longitud != null) {
            suministro.setLatitud(latitud);
            suministro.setLongitud(longitud);
            actualizarSum = true;
        }
        if (direccionParam != null && !direccionParam.isBlank()
                && ("00000000".equals(suministro.getCodigoSuministro())
                    || suministro.getDireccion() == null
                    || suministro.getDireccion().isBlank()
                    || suministro.getDireccion().startsWith("Ubicación GPS"))) {
            suministro.setDireccion(direccionParam.trim());
            actualizarSum = true;
        }
        if (actualizarSum) {
            suministroRepository.save(suministro);
        }

        Reporte reporte = new Reporte();

        reporte.setSuministroId(suministro);
        reporte.setTipoProblema(tipoProblema);
        reporte.setDescripcion(descripcion);
        reporte.setEstado("PENDIENTE");
        String prioridad = prioridadService.calcularPrioridad(tipoProblema);
        reporte.setPrioridad(prioridad);
        reporte.setFechaCreacion(LocalDateTime.now());

        return reporteRepository.save(reporte);
    }

    private Suministro crearSuministroParaCiudadano(
            String codigo,
            String dni,
            String nombreTitular,
            String direccion,
            Double latitud,
            Double longitud) {

        Cliente cliente = clienteRepository.findByDni(dni)
                .orElseGet(() -> {
                    Cliente nuevoCli = new Cliente();
                    nuevoCli.setDni(dni);
                    nuevoCli.setNombreCompleto(nombreTitular);
                    nuevoCli.setEstado("ACTIVO");
                    nuevoCli.setFechaRegistro(LocalDateTime.now());
                    return clienteRepository.save(nuevoCli);
                });

        String dirFinal = (direccion != null && !direccion.isBlank())
                ? direccion.trim()
                : (latitud != null && longitud != null
                        ? String.format(java.util.Locale.ROOT, "Ubicación GPS (%.5f, %.5f)", latitud, longitud)
                        : "Ica, Perú");

        Suministro nuevo = new Suministro();
        nuevo.setCodigoSuministro(codigo);
        nuevo.setDni(dni);
        nuevo.setNombreTitular(nombreTitular);
        nuevo.setDireccion(dirFinal);
        nuevo.setLatitud(latitud != null ? latitud : -14.0678);
        nuevo.setLongitud(longitud != null ? longitud : -75.7286);
        nuevo.setCategoria("DOMESTICO");
        nuevo.setCliente(cliente);
        return suministroRepository.save(nuevo);
    }

    public List<ReporteResponseDTO> obtenerTodosLosReportes() {
    return reporteRepository.obtenerTodosLosReportes();
}

public Optional<ReporteResponseDTO> obtenerReportePorId(Long id) {
    return reporteRepository.obtenerReportePorId(id);
}
public List<ReporteResponseDTO> obtenerReportesPorCodigoSuministro(
        String codigo) {

    return reporteRepository.obtenerReportesPorCodigoSuministro(codigo);
}

public List<ReporteResponseDTO> obtenerReportesPorClienteId(
        Long clienteId) {
    return reporteRepository.obtenerReportesPorClienteId(clienteId);
}

public List<ReporteResponseDTO> obtenerMisReportes(String dni) {

    return reporteRepository.obtenerReportesPorDni(dni);

}

public Optional<ReporteResponseDTO> obtenerReportePublico(
        Long id,
        String codigo) {

    return reporteRepository.obtenerReportePorId(id)
            .filter(reporte ->
                    reporte.getCodigoSuministro() != null &&
                    reporte.getCodigoSuministro()
                            .equalsIgnoreCase(codigo.trim())
            );
}

@Transactional
public Reporte reabrirCaso(Long reporteId) {

    Reporte reporte = reporteRepository
            .findById(reporteId)
            .orElseThrow(() ->
                    new RuntimeException(
                            "Reporte no encontrado"
                    )
            );


    if (!"NO_RESUELTO".equalsIgnoreCase(
            reporte.getEstado())) {

        throw new RuntimeException(
                "Solo se pueden reabrir reportes no resueltos"
        );
    }


    Authentication authentication =
            SecurityContextHolder
                    .getContext()
                    .getAuthentication();


    if (authentication == null ||
            !(authentication.getPrincipal()
                    instanceof CustomUserDetails)) {

        throw new RuntimeException(
                "No se pudo obtener el usuario autenticado"
        );
    }


    CustomUserDetails userDetails =
            (CustomUserDetails)
                    authentication.getPrincipal();


    if (userDetails.getUsuario().getPersonal() == null) {

        throw new RuntimeException(
                "El usuario no tiene personal asociado"
        );
    }


    Long personalId =
            userDetails.getUsuario()
                    .getPersonal()
                    .getId();


    Personal personal =
            personalRepository
                    .findById(personalId)
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Personal no encontrado"
                            )
                    );


    reporte.setEstado("REABIERTO");

    Reporte guardado =
            reporteRepository.save(reporte);


    Seguimiento seguimiento =
            new Seguimiento();

    seguimiento.setReporte(reporte);
    seguimiento.setPersonal(personal);
    seguimiento.setEstado("REABIERTO");

    seguimiento.setComentario(
            "El caso fue reabierto por el administrador para una nueva intervención."
    );

    seguimiento.setFechaCreacion(
            LocalDateTime.now()
    );


    seguimientoRepository.save(seguimiento);


    return guardado;
}


}
