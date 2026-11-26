package com.aquaica.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Service;

/**
 * Servicio opcional de almacenamiento en Cloudinary mediante API REST firmada.
 * Si no hay credenciales configuradas, retorna Optional.empty() para usar el
 * respaldo automático en PostgreSQL.
 */
@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final HttpClient httpClient;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.url:}") String cloudinaryUrl) {

        String resolvedCloud = trimOrEmpty(cloudName);
        String resolvedKey = trimOrEmpty(apiKey);
        String resolvedSecret = trimOrEmpty(apiSecret);

        String urlRaw = trimOrEmpty(cloudinaryUrl);
        if (urlRaw.isEmpty()) {
            urlRaw = trimOrEmpty(System.getenv("CLOUDINARY_URL"));
        }
        if ((resolvedCloud.isEmpty() || resolvedKey.isEmpty() || resolvedSecret.isEmpty())
                && urlRaw.startsWith("cloudinary://")) {
            try {
                URI uri = URI.create(urlRaw);
                if (resolvedCloud.isEmpty() && uri.getHost() != null) {
                    resolvedCloud = uri.getHost();
                }
                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (resolvedKey.isEmpty()) resolvedKey = parts[0];
                    if (resolvedSecret.isEmpty()) resolvedSecret = parts[1];
                }
            } catch (Exception e) {
                log.warn("CLOUDINARY_URL inválida: {}", e.getMessage());
            }
        }

        this.cloudName = resolvedCloud;
        this.apiKey = resolvedKey;
        this.apiSecret = resolvedSecret;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (isConfigured()) {
            log.info("[AquaIca Cloudinary] Almacenamiento en nube activo (cloud: {})", this.cloudName);
        } else {
            log.info("[AquaIca Cloudinary] Sin credenciales configuradas; usando respaldo en PostgreSQL.");
        }
    }

    public boolean isConfigured() {
        return !cloudName.isEmpty() && !apiKey.isEmpty() && !apiSecret.isEmpty();
    }

    public Optional<String> subirImagen(byte[] bytes, String carpeta, String nombreArchivo) {
        if (!isConfigured() || bytes == null || bytes.length == 0) {
            return Optional.empty();
        }

        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            String folderClean = trimOrEmpty(carpeta).isEmpty() ? "aquaica" : trimOrEmpty(carpeta);
            String firmaBase = "folder=" + folderClean + "&timestamp=" + timestamp + apiSecret;
            String firma = sha1Hex(firmaBase);

            String boundary = "----AquaIcaBoundary" + UUID.randomUUID().toString().replace("-", "");
            byte[] multipartBody = construirMultipart(
                    boundary,
                    Map.of(
                            "api_key", apiKey,
                            "timestamp", String.valueOf(timestamp),
                            "folder", folderClean,
                            "signature", firma
                    ),
                    bytes,
                    (nombreArchivo != null && !nombreArchivo.isBlank()) ? nombreArchivo : "evidencia.jpg"
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload"))
                    .timeout(Duration.ofSeconds(25))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300 && response.body() != null) {
                Map<String, Object> json = JsonParserFactory.getJsonParser().parseMap(response.body());
                Object secureUrl = json.get("secure_url");
                if (secureUrl != null && !String.valueOf(secureUrl).isBlank()) {
                    return Optional.of(String.valueOf(secureUrl));
                }
            }
            log.warn("[AquaIca Cloudinary] Subida falló con código {}: {}", response.statusCode(), response.body());
        } catch (Exception e) {
            log.warn("[AquaIca Cloudinary] Error subiendo imagen: {}", e.getMessage());
        }

        return Optional.empty();
    }

    public Optional<String> subirImagenDataUrl(String dataUrl, String carpeta, String nombreArchivo) {
        if (!isConfigured() || dataUrl == null || !dataUrl.startsWith("data:image/")) {
            return Optional.empty();
        }
        int commaIdx = dataUrl.indexOf(',');
        if (commaIdx < 0) {
            return Optional.empty();
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(commaIdx + 1));
            return subirImagen(bytes, carpeta, nombreArchivo);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private byte[] construirMultipart(
            String boundary,
            Map<String, String> campos,
            byte[] archivoBytes,
            String nombreArchivo) throws IOException {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (Map.Entry<String, String> entry : campos.entrySet()) {
            out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(("Content-Disposition: form-data; name=\"" + entry.getKey() + "\"\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            out.write((entry.getValue() + "\r\n").getBytes(StandardCharsets.UTF_8));
        }

        String safeName = nombreArchivo.replace("\"", "_");
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + safeName + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        out.write("Content-Type: application/octet-stream\r\n\r\n".getBytes(StandardCharsets.UTF_8));
        out.write(archivoBytes);
        out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    private String sha1Hex(String texto) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] digest = md.digest(texto.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String trimOrEmpty(String v) {
        return v == null ? "" : v.trim();
    }
}
