package com.aquaica.config;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.entity.Cliente;
import com.aquaica.entity.ComunicadoOficial;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Asignacion;
import com.aquaica.entity.InformeTecnico;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Suministro;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.ComunicadoOficialRepository;
import com.aquaica.repository.InformeTecnicoRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.ReporteRepository;
import com.aquaica.repository.SuministroRepository;
import com.aquaica.repository.UsuarioRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final PersonalRepository personalRepository;
    private final ClienteRepository clienteRepository;
    private final SuministroRepository suministroRepository;
    private final ReporteRepository reporteRepository;
    private final AsignacionRepository asignacionRepository;
    private final InformeTecnicoRepository informeTecnicoRepository;
    private final ComunicadoOficialRepository comunicadoRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.aquaica.service.DniLookupService dniLookupService;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            PersonalRepository personalRepository,
            ClienteRepository clienteRepository,
            SuministroRepository suministroRepository,
            ReporteRepository reporteRepository,
            AsignacionRepository asignacionRepository,
            InformeTecnicoRepository informeTecnicoRepository,
            ComunicadoOficialRepository comunicadoRepository,
            PasswordEncoder passwordEncoder,
            com.aquaica.service.DniLookupService dniLookupService) {
        this.usuarioRepository = usuarioRepository;
        this.personalRepository = personalRepository;
        this.clienteRepository = clienteRepository;
        this.suministroRepository = suministroRepository;
        this.reporteRepository = reporteRepository;
        this.asignacionRepository = asignacionRepository;
        this.informeTecnicoRepository = informeTecnicoRepository;
        this.comunicadoRepository = comunicadoRepository;
        this.passwordEncoder = passwordEncoder;
        this.dniLookupService = dniLookupService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            log.info("Inicializando datos base de AquaIca...");
            inicializarDatosBase();
        } else {
            log.info("La base de datos ya cuenta con registros base.");
            limpiarPerfilPruebaMaria();
        }

        garantizarTecnicosRequeridos();
    }

    private void limpiarPerfilPruebaMaria() {
        try {
            usuarioRepository.findByUsername("mariaquispe").ifPresent(usuarioRepository::delete);

            Cliente clienteReemplazo = clienteRepository.findAll().stream()
                    .filter(c -> c.getNombreCompleto() == null
                            || !c.getNombreCompleto().toLowerCase().contains("maría quispe")
                            && !c.getNombreCompleto().toLowerCase().contains("maria quispe"))
                    .findFirst()
                    .orElse(null);

            for (Suministro s : suministroRepository.findAll()) {
                boolean esMaria = (s.getNombreTitular() != null
                        && (s.getNombreTitular().toLowerCase().contains("maría quispe")
                            || s.getNombreTitular().toLowerCase().contains("maria quispe")))
                        || (s.getCliente() != null && s.getCliente().getNombreCompleto() != null
                            && (s.getCliente().getNombreCompleto().toLowerCase().contains("maría quispe")
                                || s.getCliente().getNombreCompleto().toLowerCase().contains("maria quispe")));

                if (!esMaria) continue;

                boolean tieneReportes = !reporteRepository.obtenerReportesPorCodigoSuministro(s.getCodigoSuministro()).isEmpty();
                if ("SUM-00125".equalsIgnoreCase(s.getCodigoSuministro()) && !tieneReportes) {
                    suministroRepository.delete(s);
                } else if ("00000000".equals(s.getCodigoSuministro())) {
                    s.setNombreTitular("Incidencia Vecinal / Vía Pública");
                    if (clienteReemplazo != null) s.setCliente(clienteReemplazo);
                    suministroRepository.save(s);
                } else if (s.getDni() != null && s.getDni().matches("\\d{8}") && !"71234567".equals(s.getDni())) {
                    // Suministro contaminado con DNI real de otro usuario por versión previa
                    if (!tieneReportes) {
                        suministroRepository.delete(s);
                    } else {
                        java.util.Map<String, Object> real = dniLookupService.consultarReniecReal(s.getDni());
                        String nombreReal = real.get("nombreCompleto") != null
                                ? String.valueOf(real.get("nombreCompleto"))
                                : "Ciudadano DNI " + s.getDni();
                        s.setNombreTitular(nombreReal);
                        if (clienteReemplazo != null) s.setCliente(clienteReemplazo);
                        suministroRepository.save(s);
                    }
                } else {
                    s.setNombreTitular("Usuario AquaIca");
                    if (clienteReemplazo != null) s.setCliente(clienteReemplazo);
                    suministroRepository.save(s);
                }
            }

            clienteRepository.findByDni("71234567").ifPresent(c -> {
                if (c.getNombreCompleto() != null
                        && (c.getNombreCompleto().toLowerCase().contains("maría quispe")
                            || c.getNombreCompleto().toLowerCase().contains("maria quispe"))) {
                    if (suministroRepository.findByClienteId(c.getId()).isEmpty()
                            && usuarioRepository.findByClienteId(c.getId()).isEmpty()) {
                        clienteRepository.delete(c);
                    }
                }
            });
        } catch (Exception e) {
            log.debug("Aviso al limpiar registros previos de prueba: {}", e.getMessage());
        }
    }

    private void inicializarDatosBase() {
        // 1. Personal y Usuarios Administrativos
        Personal adminPersonal = new Personal();
        adminPersonal.setNombre("Carlos Mendoza (Administrador)");
        adminPersonal.setDni("70001001");
        adminPersonal.setTelefono("956100200");
        adminPersonal.setEspecialidad("GESTION");
        adminPersonal.setEstado("ACTIVO");
        adminPersonal.setFechaRegistro(LocalDateTime.now().minusDays(30));
        personalRepository.save(adminPersonal);

        Usuario adminUser = new Usuario();
        adminUser.setUsername("admin");
        adminUser.setPassword(passwordEncoder.encode("admin123456"));
        adminUser.setRol("ADMIN");
        adminUser.setEstado("ACTIVO");
        adminUser.setPersonal(adminPersonal);
        adminUser.setFechaCreacion(LocalDateTime.now().minusDays(30));
        usuarioRepository.save(adminUser);

        Personal tecnico1 = new Personal();
        tecnico1.setNombre("Luis Ramírez (Técnico de Fugas)");
        tecnico1.setDni("70001002");
        tecnico1.setTelefono("956100201");
        tecnico1.setEspecialidad("FUGA");
        tecnico1.setEstado("ACTIVO");
        tecnico1.setFechaRegistro(LocalDateTime.now().minusDays(20));
        personalRepository.save(tecnico1);

        Usuario tecnicoUser1 = new Usuario();
        tecnicoUser1.setUsername("tecnico1");
        tecnicoUser1.setPassword(passwordEncoder.encode("tecnico123456"));
        tecnicoUser1.setRol("TECNICO");
        tecnicoUser1.setEstado("ACTIVO");
        tecnicoUser1.setPersonal(tecnico1);
        tecnicoUser1.setFechaCreacion(LocalDateTime.now().minusDays(20));
        usuarioRepository.save(tecnicoUser1);

        // 2. Clientes ciudadanos de referencia
        Cliente cliente2 = new Cliente();
        cliente2.setDni("72345678");
        cliente2.setNombreCompleto("Jorge Ramos Alvites");
        cliente2.setEmail("jorge.ramos@gmail.com");
        cliente2.setTelefono("956333444");
        cliente2.setEstado("ACTIVO");
        cliente2.setFechaRegistro(LocalDateTime.now().minusDays(10));
        clienteRepository.save(cliente2);

        Cliente cliente3 = new Cliente();
        cliente3.setDni("73456789");
        cliente3.setNombreCompleto("Rosa Medina Díaz");
        cliente3.setEmail("rosa.medina@gmail.com");
        cliente3.setTelefono("956555666");
        cliente3.setEstado("ACTIVO");
        cliente3.setFechaRegistro(LocalDateTime.now().minusDays(5));
        clienteRepository.save(cliente3);

        // 3. Suministros con coordenadas de Ica
        Suministro s0 = new Suministro();
        s0.setCodigoSuministro("00000000");
        s0.setNombreTitular("Incidencia Vecinal / Vía Pública");
        s0.setDni("00000000");
        s0.setDireccion("Vía Pública, Cercado de Ica");
        s0.setLatitud(-14.0678);
        s0.setLongitud(-75.7286);
        s0.setCategoria("DOMESTICO");
        s0.setCliente(cliente2);
        suministroRepository.save(s0);

        Suministro s2 = new Suministro();
        s2.setCodigoSuministro("SUM-00126");
        s2.setNombreTitular("Jorge Ramos Alvites");
        s2.setDni("72345678");
        s2.setDireccion("Av. Pachacútec 140, Parcona");
        s2.setLatitud(-14.0534);
        s2.setLongitud(-75.7082);
        s2.setCategoria("DOMESTICO");
        s2.setCliente(cliente2);
        suministroRepository.save(s2);

        Suministro s3 = new Suministro();
        s3.setCodigoSuministro("SUM-00127");
        s3.setNombreTitular("Rosa Medina Díaz");
        s3.setDni("73456789");
        s3.setDireccion("Calle Lima 312, La Tinguiña");
        s3.setLatitud(-14.0412);
        s3.setLongitud(-75.7115);
        s3.setCategoria("DOMESTICO");
        s3.setCliente(cliente3);
        suministroRepository.save(s3);

        Suministro s4 = new Suministro();
        s4.setCodigoSuministro("SUM-00128");
        s4.setNombreTitular("Carlos Mendoza");
        s4.setDni("70001001");
        s4.setDireccion("Av. Los Maestros 325, Ica Cercado");
        s4.setLatitud(-14.0678);
        s4.setLongitud(-75.7286);
        s4.setCategoria("COMERCIAL");
        s4.setCliente(cliente2);
        suministroRepository.save(s4);

        // 4. Reportes de prueba para el Feed
        Reporte r1 = new Reporte();
        r1.setSuministroId(s2);
        r1.setTipoProblema("FUGA_AGUA");
        r1.setDescripcion("Rotura de tubería de agua frente al parque principal. Hay gran desperdicio de agua en la pista desde temprano.");
        r1.setEstado("PENDIENTE");
        r1.setPrioridad("ALTA");
        r1.setFechaCreacion(LocalDateTime.now().minusMinutes(45));
        r1.setAfectadosCount(8);
        reporteRepository.save(r1);

        Reporte r2 = new Reporte();
        r2.setSuministroId(s3);
        r2.setTipoProblema("SIN_AGUA");
        r2.setDescripcion("Corte de agua imprevisto en toda la cuadra 3 de Calle Lima. No hay presión en las cañerías.");
        r2.setEstado("EN_ATENCION");
        r2.setPrioridad("MEDIA");
        r2.setFechaCreacion(LocalDateTime.now().minusHours(2));
        r2.setAfectadosCount(14);
        reporteRepository.save(r2);

        Reporte r3 = new Reporte();
        r3.setSuministroId(s4);
        r3.setTipoProblema("BAJA_PRESION");
        r3.setDescripcion("Baja presión constante de agua durante el mediodía. Dificulta el llenado de tanques.");
        r3.setEstado("RESUELTO");
        r3.setPrioridad("BAJA");
        r3.setFechaCreacion(LocalDateTime.now().minusDays(1));
        r3.setAfectadosCount(3);
        reporteRepository.save(r3);

        // 5. Comunicado oficial de corte (EMAPICA)
        ComunicadoOficial com1 = new ComunicadoOficial();
        com1.setTitulo("Corte programado por mantenimiento de pozo N° 5");
        com1.setDescripcion("Se suspenderá temporalmente el servicio de agua potable para realizar trabajos de desarenado y purga en la estación de bombeo.");
        com1.setEntidadEmisora("EMAPICA S.A.");
        com1.setDistrito("La Tinguiña");
        com1.setZonaAfectada("Sectores A y B, Av. Las Palmeras");
        com1.setTipoCorte("PROGRAMADO");
        com1.setFechaInicioCorte(LocalDateTime.now().plusHours(2));
        com1.setFechaFinCorte(LocalDateTime.now().plusHours(8));
        com1.setActivo(true);
        com1.setFechaPublicacion(LocalDateTime.now().minusMinutes(20));
        com1.setCreadoPor("EMAPICA Comunicaciones");
        comunicadoRepository.save(com1);

        log.info("✅ Datos base de AquaIca cargados exitosamente.");
    }

    private void garantizarTecnicosRequeridos() {
        log.info("👷 Asegurando dotación de técnicos: 2 por especialidad y 3 generales (para todo)...");

        // 1. Redes y fugas (2 técnicos)
        crearOActualizarTecnico("tecnico1", "Luis Ramírez Ramos", "70102001", "956101001", "REDES_FUGAS");
        crearOActualizarTecnico("tecnico2", "Marcos Benavides Peña", "70102002", "956101002", "REDES_FUGAS");

        // 2. Presión y tuberías (2 técnicos)
        crearOActualizarTecnico("tecnico3", "Víctor Chávez Huamán", "70102003", "956101003", "PRESION_TUBERIAS");
        crearOActualizarTecnico("tecnico4", "Daniel Morales Soto", "70102004", "956101004", "PRESION_TUBERIAS");

        // 3. Facturación y atención (2 técnicos)
        crearOActualizarTecnico("tecnico5", "Gabriel Espinoza Torres", "70102005", "956101005", "FACTURACION");
        crearOActualizarTecnico("tecnico6", "Fernando Castro Rivas", "70102006", "956101006", "FACTURACION");

        // 4. Atención general (3 técnicos para todo)
        crearOActualizarTecnico("tecnico7", "Héctor Quispe Melgar", "70102007", "956101007", "GENERAL");
        crearOActualizarTecnico("tecnico8", "Raúl Gutiérrez Alarcón", "70102008", "956101008", "GENERAL");
        crearOActualizarTecnico("tecnico9", "Andrés Salazar Palomino", "70102009", "956101009", "GENERAL");

        // Asignación e informe de prueba para historial técnico si no hay asignaciones
        Personal t1 = personalRepository.findByDni("70102001").orElse(null);
        if (t1 != null && asignacionRepository.count() == 0) {
            Reporte r3 = reporteRepository.findAll().stream()
                    .filter(rep -> "RESUELTO".equalsIgnoreCase(rep.getEstado()))
                    .findFirst().orElse(null);
            if (r3 != null) {
                Asignacion a = new Asignacion();
                a.setPersonal(t1);
                a.setReporte(r3);
                a.setFechaAsignacion(LocalDateTime.now().minusDays(1));
                a.setObservaciones("Atención prioritaria de baja presión en Cercado.");
                a.setEstado("FINALIZADA");
                asignacionRepository.save(a);

                InformeTecnico inf = new InformeTecnico();
                inf.setReporte(r3);
                inf.setAsignacion(a);
                inf.setPersonal(t1);
                inf.setDiagnostico("Válvula de paso principal con sedimentación calcárea reduciendo caudal.");
                inf.setTrabajoRealizado("Desobstrucción mecánica de matriz, cambio de empaquetadura y calibración de presión.");
                inf.setResultado("SOLUCIONADO");
                inf.setFechaCreacion(LocalDateTime.now().minusHours(18));
                informeTecnicoRepository.save(inf);
            }
        }

        log.info("✅ 9 técnicos configurados y disponibles en el sistema.");
    }

    private void crearOActualizarTecnico(
            String username,
            String nombre,
            String dni,
            String telefono,
            String especialidad) {

        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        Personal personal = (usuario != null && usuario.getPersonal() != null)
                ? usuario.getPersonal()
                : personalRepository.findByDni(dni).orElse(null);

        if (personal == null) {
            personal = new Personal();
            personal.setNombre(nombre);
            personal.setDni(dni);
            personal.setTelefono(telefono);
            personal.setEspecialidad(especialidad);
            personal.setEstado("ACTIVO");
            personal.setFechaRegistro(LocalDateTime.now().minusDays(10));
            personal = personalRepository.save(personal);
        } else {
            personal.setNombre(nombre);
            personal.setTelefono(telefono);
            personal.setEspecialidad(especialidad);
            personal.setEstado("ACTIVO");
            personal = personalRepository.save(personal);
        }

        if (usuario == null) {
            usuario = new Usuario();
            usuario.setUsername(username);
            usuario.setPassword(passwordEncoder.encode("tecnico123456"));
            usuario.setRol("TECNICO");
            usuario.setEstado("ACTIVO");
            usuario.setPersonal(personal);
            usuario.setFechaCreacion(LocalDateTime.now().minusDays(10));
            usuarioRepository.save(usuario);
        } else {
            usuario.setPersonal(personal);
            usuario.setRol("TECNICO");
            usuario.setEstado("ACTIVO");
            usuarioRepository.save(usuario);
        }
    }
}
