package com.aquaica.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aquaica.entity.Cliente;
import com.aquaica.entity.Suministro;
import com.aquaica.repository.ClienteRepository;
import com.aquaica.repository.SuministroRepository;

@Service
public class DniLookupService {

    private static final Logger log = LoggerFactory.getLogger(DniLookupService.class);

    private final SuministroRepository suministroRepository;
    private final ClienteRepository clienteRepository;
    private final HttpClient httpClient;
    private final Map<String, Map<String, Object>> cacheReniec = new ConcurrentHashMap<>();

    public DniLookupService(
            SuministroRepository suministroRepository,
            ClienteRepository clienteRepository) {
        this.suministroRepository = suministroRepository;
        this.clienteRepository = clienteRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validarIdentidad(String valorBruto) {
        Map<String, Object> resp = new LinkedHashMap<>();
        if (valorBruto == null || valorBruto.isBlank()) {
            resp.put("encontrado", false);
            resp.put("fuente", "INVALIDO");
            resp.put("mensaje", "Ingresa un DNI de 8 dígitos o código de suministro.");
            return resp;
        }

        String valor = valorBruto.trim();

        if ("00000000".equals(valor)) {
            resp.put("encontrado", true);
            resp.put("fuente", "VIA_PUBLICA");
            resp.put("dni", "00000000");
            resp.put("codigoSuministro", "00000000");
            resp.put("nombreCompleto", "Incidencia en Vía Pública / Vecinal");
            resp.put("direccion", null);
            resp.put("mensaje", "Modo vía pública activado.");
            return resp;
        }

        // 1. Buscar coincidencia exacta por código de suministro en padrón AquaIca
        Optional<Suministro> porCodigo = suministroRepository.findByCodigoSuministro(valor);
        if (porCodigo.isPresent()) {
            return construirDesdeSuministro(porCodigo.get());
        }

        // 2. Si es un DNI de 8 dígitos, buscar por DNI en suministros y clientes
        if (valor.matches("\\d{8}")) {
            Optional<Suministro> porDniSum = suministroRepository.findFirstByDni(valor);
            if (porDniSum.isPresent()) {
                return construirDesdeSuministro(porDniSum.get());
            }

            Optional<Cliente> porDniCliente = clienteRepository.findByDni(valor);
            if (porDniCliente.isPresent()) {
                Cliente c = porDniCliente.get();
                List<Suministro> sumCliente = suministroRepository.findByClienteId(c.getId());
                if (!sumCliente.isEmpty()) {
                    return construirDesdeSuministro(sumCliente.get(0));
                }
                resp.put("encontrado", true);
                resp.put("fuente", "PADRON_AQUAICA");
                resp.put("dni", c.getDni());
                resp.put("nombreCompleto", c.getNombreCompleto());
                resp.put("codigoSuministro", null);
                resp.put("direccion", null);
                resp.put("latitud", null);
                resp.put("longitud", null);
                resp.put("mensaje", "Ciudadano verificado en padrón AquaIca.");
                return resp;
            }

            // 3. Consultar servicio real de RENIEC (Perú)
            Map<String, Object> reniec = consultarReniecReal(valor);
            if (Boolean.TRUE.equals(reniec.get("encontrado"))) {
                return reniec;
            }
        }

        resp.put("encontrado", false);
        resp.put("fuente", "NO_ENCONTRADO");
        resp.put("dni", valor.matches("\\d{8}") ? valor : null);
        resp.put("mensaje", "No se encontró información registrada para ese DNI o código de suministro.");
        return resp;
    }

    private Map<String, Object> construirDesdeSuministro(Suministro s) {
        Map<String, Object> resp = new LinkedHashMap<>();
        String nombre = s.getNombreTitular();
        if ((nombre == null || nombre.isBlank()) && s.getCliente() != null) {
            nombre = s.getCliente().getNombreCompleto();
        }
        String dni = s.getDni();
        if ((dni == null || dni.isBlank()) && s.getCliente() != null) {
            dni = s.getCliente().getDni();
        }

        resp.put("encontrado", true);
        resp.put("fuente", "PADRON_AQUAICA");
        resp.put("dni", dni);
        resp.put("nombreCompleto", nombre);
        resp.put("codigoSuministro", s.getCodigoSuministro());
        resp.put("direccion", s.getDireccion());
        resp.put("latitud", s.getLatitud());
        resp.put("longitud", s.getLongitud());
        resp.put("mensaje", "Información encontrada en padrón AquaIca.");
        return resp;
    }

    public Map<String, Object> consultarReniecReal(String dni) {
        if (cacheReniec.containsKey(dni)) {
            return cacheReniec.get(dni);
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.apis.net.pe/v1/dni?numero=" + dni))
                    .timeout(Duration.ofSeconds(6))
                    .header("Accept", "application/json")
                    .header("User-Agent", "AquaIca/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null && !response.body().isBlank()) {
                Map<String, Object> json = JsonParserFactory.getJsonParser().parseMap(response.body());

                String nombre = stringOrEmpty(json.get("nombre"));
                if (nombre.isEmpty()) {
                    String nombres = stringOrEmpty(json.get("nombres"));
                    String apPat = stringOrEmpty(json.get("apellidoPaterno"));
                    String apMat = stringOrEmpty(json.get("apellidoMaterno"));
                    nombre = String.join(" ", List.of(nombres, apPat, apMat))
                            .replaceAll("\\s+", " ")
                            .trim();
                }

                if (!nombre.isEmpty()) {
                    String dir = construirDireccionReniec(json);
                    resultado.put("encontrado", true);
                    resultado.put("fuente", "RENIEC");
                    resultado.put("dni", dni);
                    resultado.put("nombreCompleto", formatearNombrePropio(nombre));
                    resultado.put("codigoSuministro", null);
                    resultado.put("direccion", dir.isEmpty() ? null : dir);
                    resultado.put("latitud", null);
                    resultado.put("longitud", null);
                    resultado.put("mensaje", "Identidad validada en RENIEC.");
                    cacheReniec.put(dni, resultado);
                    return resultado;
                }
            } else {
                log.warn("Consulta RENIEC para DNI {} devolvió código {}", dni, response.statusCode());
            }
        } catch (Exception e) {
            log.warn("No se pudo consultar RENIEC para DNI {}: {}", dni, e.getMessage());
        }

        resultado.put("encontrado", false);
        resultado.put("fuente", "NO_ENCONTRADO");
        return resultado;
    }

    private String construirDireccionReniec(Map<String, Object> json) {
        String dir = stringOrEmpty(json.get("direccion"));
        String dist = stringOrEmpty(json.get("distrito"));
        String prov = stringOrEmpty(json.get("provincia"));
        String dept = stringOrEmpty(json.get("departamento"));

        StringBuilder sb = new StringBuilder();
        if (!dir.isEmpty()) sb.append(dir);
        if (!dist.isEmpty()) sb.append(sb.length() > 0 ? ", " : "").append(dist);
        if (!prov.isEmpty() && !prov.equalsIgnoreCase(dist)) sb.append(sb.length() > 0 ? ", " : "").append(prov);
        if (!dept.isEmpty() && !dept.equalsIgnoreCase(prov)) sb.append(sb.length() > 0 ? ", " : "").append(dept);
        return sb.toString().trim();
    }

    private String stringOrEmpty(Object val) {
        return val == null ? "" : String.valueOf(val).trim();
    }

    private String formatearNombrePropio(String texto) {
        String[] palabras = texto.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : palabras) {
            if (p.isEmpty()) continue;
            if (sb.length() > 0) sb.append(" ");
            sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
        }
        return sb.toString();
    }
}
