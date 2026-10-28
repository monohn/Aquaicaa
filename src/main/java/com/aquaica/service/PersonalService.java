package com.aquaica.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.dto.HistorialTecnicoDTO;
import com.aquaica.dto.PersonalRequestDTO;
import com.aquaica.dto.PersonalResponseDTO;
import com.aquaica.dto.TecnicoDisponibleDTO;
import com.aquaica.entity.Asignacion;
import com.aquaica.entity.Especialidad;
import com.aquaica.entity.InformeTecnico;
import com.aquaica.entity.Personal;
import com.aquaica.entity.Reporte;
import com.aquaica.entity.Suministro;
import com.aquaica.entity.Usuario;
import com.aquaica.repository.AsignacionRepository;
import com.aquaica.repository.InformeTecnicoRepository;
import com.aquaica.repository.PersonalRepository;
import com.aquaica.repository.UsuarioRepository;

@Service
public class PersonalService {

    private static final List<String> ESTADOS_OCUPADO =
            List.of("ACTIVA", "EN_ATENCION");

    private final PersonalRepository personalRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsignacionRepository asignacionRepository;
    private final InformeTecnicoRepository informeTecnicoRepository;
    private final PasswordEncoder passwordEncoder;

    public PersonalService(
            PersonalRepository personalRepository,
            UsuarioRepository usuarioRepository,
            AsignacionRepository asignacionRepository,
            InformeTecnicoRepository informeTecnicoRepository,
            PasswordEncoder passwordEncoder) {

        this.personalRepository = personalRepository;
        this.usuarioRepository = usuarioRepository;
        this.asignacionRepository = asignacionRepository;
        this.informeTecnicoRepository = informeTecnicoRepository;
        this.passwordEncoder = passwordEncoder;
    }


    @Transactional
    public PersonalResponseDTO registrarPersonalConUsuario(
            PersonalRequestDTO datos) {

        validarDatosBasicos(datos, true);

        if (personalRepository.existsByDni(datos.getDni())) {
            throw new RuntimeException(
                    "Ya existe personal registrado con ese DNI"
            );
        }

        if (usuarioRepository.existsByUsername(datos.getUsername())) {
            throw new RuntimeException(
                    "El username ya está registrado"
            );
        }

        Personal personal = new Personal();

        personal.setNombre(datos.getNombre());
        personal.setDni(datos.getDni());
        personal.setTelefono(datos.getTelefono());
        personal.setEspecialidad(datos.getEspecialidad());
        personal.setEstado("ACTIVO");
        personal.setFechaRegistro(LocalDateTime.now());

        Personal personalGuardado =
                personalRepository.save(personal);

        Usuario usuario = new Usuario();

        usuario.setPersonal(personalGuardado);
        usuario.setUsername(datos.getUsername());
        usuario.setPassword(
                passwordEncoder.encode(datos.getPassword())
        );
        usuario.setRol(datos.getRol());
        usuario.setEstado("ACTIVO");
        usuario.setFechaCreacion(LocalDateTime.now());

        usuarioRepository.save(usuario);

        return personalRepository
                .obtenerPersonalPorId(personalGuardado.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "No se pudo cargar el personal registrado"
                        ));
    }


    @Transactional
    public PersonalResponseDTO actualizarPersonal(
            Long id,
            PersonalRequestDTO datos) {

        validarDatosBasicos(datos, false);

        Personal personal = personalRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));

        if (!personal.getDni().equalsIgnoreCase(datos.getDni())
                && personalRepository.existsByDni(datos.getDni())) {

            throw new RuntimeException(
                    "Ya existe personal registrado con ese DNI"
            );
        }

        personal.setNombre(datos.getNombre());
        personal.setDni(datos.getDni());
        personal.setTelefono(datos.getTelefono());
        personal.setEspecialidad(datos.getEspecialidad());

        if (datos.getEstado() != null && !datos.getEstado().isBlank()) {
            personal.setEstado(datos.getEstado());
        }

        personalRepository.save(personal);

        Usuario usuario = usuarioRepository
                .findByPersonalId(personal.getId())
                .orElse(null);

        if (usuario != null) {

            if (datos.getUsername() != null
                    && !datos.getUsername().isBlank()
                    && !datos.getUsername().equals(usuario.getUsername())) {

                if (usuarioRepository.existsByUsername(datos.getUsername())) {
                    throw new RuntimeException(
                            "El username ya está registrado"
                    );
                }

                usuario.setUsername(datos.getUsername());
            }

            if (datos.getPassword() != null
                    && !datos.getPassword().isBlank()) {

                usuario.setPassword(
                        passwordEncoder.encode(datos.getPassword())
                );
            }

            if (datos.getRol() != null && !datos.getRol().isBlank()) {
                usuario.setRol(datos.getRol());
            }

            if (personal.getEstado() != null) {
                usuario.setEstado(
                        "ACTIVO".equalsIgnoreCase(personal.getEstado())
                                ? "ACTIVO"
                                : "INACTIVO"
                );
            }

            usuarioRepository.save(usuario);
        }

        return personalRepository
                .obtenerPersonalPorId(personal.getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "No se pudo cargar el personal actualizado"
                        ));
    }


    @Transactional
    public void desactivarPersonal(Long id) {

        Personal personal = personalRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));

        personal.setEstado("INACTIVO");

        personalRepository.save(personal);

        usuarioRepository.findByPersonalId(id)
                .ifPresent(usuario -> {
                    usuario.setEstado("INACTIVO");
                    usuarioRepository.save(usuario);
                });
    }


    public List<PersonalResponseDTO> obtenerTodoElPersonal() {

        return personalRepository.obtenerTodoElPersonal();
    }


    public PersonalResponseDTO obtenerPorDni(String dni) {

        return personalRepository.obtenerPersonalPorDni(dni)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));
    }


    public PersonalResponseDTO obtenerPorId(Long id) {

        return personalRepository.obtenerPersonalPorId(id)
                .orElseThrow(() ->
                        new RuntimeException("Personal no encontrado"));
    }


    public List<Especialidad> obtenerEspecialidades() {

        return List.of(Especialidad.values());
    }


    /**
     * Devuelve los técnicos cuya especialidad atiende el tipo
     * de problema recibido, marcando con "disponible" (true/false)
     * si tienen o no una asignación activa en este momento.
     */
    public List<TecnicoDisponibleDTO> obtenerTecnicosPorTipoProblema(
            String tipoProblema) {

        Especialidad especialidad =
                Especialidad.paraTipoProblema(tipoProblema);

        List<Personal> tecnicos = personalRepository
                .obtenerTecnicosActivosPorEspecialidad(
                        especialidad.name()
                );

        List<TecnicoDisponibleDTO> resultado = new ArrayList<>();

        for (Personal tecnico : tecnicos) {

            boolean ocupado = asignacionRepository
                    .existsByPersonalIdAndEstadoIn(
                            tecnico.getId(),
                            ESTADOS_OCUPADO
                    );

            String etiqueta = tecnico.getEspecialidad();
            try {
                etiqueta = Especialidad.valueOf(tecnico.getEspecialidad()).getEtiqueta();
            } catch (Exception ignored) {
            }

            resultado.add(new TecnicoDisponibleDTO(
                    tecnico.getId(),
                    tecnico.getNombre(),
                    tecnico.getEspecialidad(),
                    etiqueta,
                    !ocupado
            ));
        }

        return resultado;
    }


    private void validarDatosBasicos(
            PersonalRequestDTO datos,
            boolean esCreacion) {

        if (datos.getNombre() == null || datos.getNombre().isBlank()) {
            throw new RuntimeException("El nombre es obligatorio");
        }

        if (datos.getDni() == null || datos.getDni().isBlank()) {
            throw new RuntimeException("El DNI es obligatorio");
        }

        if (!Especialidad.esValida(datos.getEspecialidad())) {
            throw new RuntimeException(
                    "La especialidad seleccionada no es válida"
            );
        }

        if (esCreacion) {

            if (datos.getUsername() == null
                    || datos.getUsername().isBlank()) {

                throw new RuntimeException(
                        "El username es obligatorio"
                );
            }

            if (datos.getPassword() == null
                    || datos.getPassword().isBlank()) {

                throw new RuntimeException(
                        "La contraseña es obligatoria"
                );
            }

            if (datos.getRol() == null || datos.getRol().isBlank()) {
                throw new RuntimeException("El rol es obligatorio");
            }
        }
    }

    public PersonalResponseDTO obtenerMiPerfil(String username) {
        return personalRepository.obtenerPersonalPorUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Perfil de personal no encontrado para el usuario: " + username)
                );
    }

    @Transactional
    public PersonalResponseDTO actualizarMiPerfil(String username, PersonalRequestDTO datos) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Personal personal = usuario.getPersonal();
        if (personal == null) {
            throw new RuntimeException("El usuario no tiene una ficha de personal asociada");
        }

        if (datos.getTelefono() != null) {
            personal.setTelefono(datos.getTelefono().trim());
        }
        personalRepository.save(personal);

        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            if (datos.getPassword().trim().length() < 6) {
                throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
            }
            usuario.setPassword(passwordEncoder.encode(datos.getPassword().trim()));
            usuarioRepository.save(usuario);
        }

        return obtenerMiPerfil(username);
    }

    @Transactional(readOnly = true)
    public List<HistorialTecnicoDTO> obtenerHistorialTecnico(Long personalId) {
        List<Asignacion> asignaciones = asignacionRepository.obtenerHistorialFinalizadasPorPersonal(personalId);
        List<HistorialTecnicoDTO> resultado = new ArrayList<>();

        for (Asignacion a : asignaciones) {
            Reporte r = a.getReporte();
            Suministro s = (r != null) ? r.getSuministroId() : null;

            InformeTecnico informe = informeTecnicoRepository.findByAsignacionId(a.getId())
                    .orElseGet(() -> r != null
                            ? informeTecnicoRepository.findFirstByReporteIdOrderByFechaCreacionDesc(r.getId()).orElse(null)
                            : null);

            LocalDateTime fechaResolucion = (informe != null && informe.getFechaCreacion() != null)
                    ? informe.getFechaCreacion()
                    : a.getFechaAsignacion();

            HistorialTecnicoDTO dto = new HistorialTecnicoDTO(
                    a.getId(),
                    r != null ? r.getId() : null,
                    r != null ? r.getTipoProblema() : "SIN_TIPO",
                    r != null ? r.getDescripcion() : "",
                    r != null ? r.getEstado() : "RESUELTO",
                    a.getEstado(),
                    r != null ? r.getPrioridad() : "MEDIA",
                    s != null ? s.getCodigoSuministro() : "-",
                    s != null ? s.getDireccion() : "-",
                    a.getFechaAsignacion(),
                    fechaResolucion,
                    informe != null ? informe.getDiagnostico() : "Atención completada",
                    informe != null ? informe.getTrabajoRealizado() : "Trabajo finalizado en campo",
                    informe != null ? informe.getResultado() : "SOLUCIONADO",
                    a.getObservaciones()
            );

            resultado.add(dto);
        }

        return resultado;
    }

    @Transactional(readOnly = true)
    public List<HistorialTecnicoDTO> obtenerHistorialPorUsername(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (usuario.getPersonal() == null) {
            return List.of();
        }
        return obtenerHistorialTecnico(usuario.getPersonal().getId());
    }
}