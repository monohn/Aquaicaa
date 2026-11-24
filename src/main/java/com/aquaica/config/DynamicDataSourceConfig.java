package com.aquaica.config;

import java.net.InetSocketAddress;
import java.net.Socket;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

@Configuration
public class DynamicDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DynamicDataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/aquaica}")
    private String rawUrl;

    @Value("${spring.datasource.username:postgres}")
    private String username;

    @Value("${spring.datasource.password:RAMIROpp20//}")
    private String password;

    @Bean
    @Primary
    @Profile("local")
    public DataSource dataSource() {
        int detectedPort = detectarPuertoPostgres();
        String finalUrl = rawUrl;
        if (finalUrl != null && finalUrl.contains("localhost")) {
            finalUrl = finalUrl.replaceAll("localhost:\\d+", "localhost:" + detectedPort);
            log.info("🔌 [AquaIca] Puerto PostgreSQL auto-detectado: {} -> URL: {}", detectedPort, finalUrl);
        }

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(finalUrl)
                .username(username)
                .password(password)
                .build();
    }

    /**
     * Configuración de producción (Render + Supabase / PostgreSQL en la nube).
     * Transforma automáticamente URIs 'postgres://' de Supabase/Render a JDBC con sslmode=require.
     */
    @Bean
    @Primary
    @Profile("!local")
    public DataSource prodDataSource(
            @Value("${spring.datasource.url:#{null}}") String url,
            @Value("${DATABASE_URL:#{null}}") String envDatabaseUrl,
            @Value("${spring.datasource.username:#{null}}") String user,
            @Value("${spring.datasource.password:#{null}}") String pass) {

        String targetUrl = (envDatabaseUrl != null && !envDatabaseUrl.isBlank()) ? envDatabaseUrl : url;
        String finalUser = user;
        String finalPass = pass;

        if (targetUrl != null && (targetUrl.startsWith("postgres://") || targetUrl.startsWith("postgresql://"))) {
            try {
                // Formato Supabase/Cloud: postgres[ql]://[user]:[pass]@[host]:[port]/[db]
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                        "^postgres(?:ql)?://(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\\d+))?/(.+)$"
                );
                java.util.regex.Matcher matcher = pattern.matcher(targetUrl);
                if (matcher.matches()) {
                    String extractedUser = matcher.group(1);
                    String extractedPass = matcher.group(2);
                    String host = matcher.group(3);
                    String port = matcher.group(4) != null ? matcher.group(4) : "5432";
                    String dbAndQuery = matcher.group(5);

                    if (finalUser == null || finalUser.isBlank()) {
                        finalUser = extractedUser != null ? java.net.URLDecoder.decode(extractedUser, java.nio.charset.StandardCharsets.UTF_8) : null;
                    }
                    if (finalPass == null || finalPass.isBlank()) {
                        finalPass = extractedPass != null ? java.net.URLDecoder.decode(extractedPass, java.nio.charset.StandardCharsets.UTF_8) : null;
                    }

                    targetUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbAndQuery;
                    if (!targetUrl.contains("sslmode")) {
                        targetUrl += (targetUrl.contains("?") ? "&" : "?") + "sslmode=require";
                    }
                } else {
                    if (targetUrl.startsWith("postgres://")) {
                        targetUrl = "jdbc:postgresql://" + targetUrl.substring("postgres://".length());
                    } else if (targetUrl.startsWith("postgresql://")) {
                        targetUrl = "jdbc:postgresql://" + targetUrl.substring("postgresql://".length());
                    }
                    if (!targetUrl.contains("sslmode")) {
                        targetUrl += (targetUrl.contains("?") ? "&" : "?") + "sslmode=require";
                    }
                }
                log.info("🔌 [AquaIca] Supabase/Cloud DATABASE_URL adaptada a JDBC con SSL.");
            } catch (Exception e) {
                log.warn("Aviso al parsear DATABASE_URL: {}, aplicando prefijo jdbc:", e.getMessage());
                if (!targetUrl.startsWith("jdbc:")) {
                    targetUrl = "jdbc:" + targetUrl;
                }
            }
        } else if (targetUrl != null && !targetUrl.contains("sslmode") && !targetUrl.contains("localhost")) {
            targetUrl += (targetUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        log.info("🔌 [AquaIca] Iniciando conexión PostgreSQL Cloud (Supabase/Render)");

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(targetUrl)
                .username(finalUser)
                .password(finalPass)
                .build();
    }

    /**
     * Prueba los puertos más comunes de PostgreSQL (5432 estándar, 5436 Docker).
     * El primero que responda conexión se usa automáticamente.
     */
    private int detectarPuertoPostgres() {
        int[] puertos = {5432, 5436, 5433, 5434};
        for (int p : puertos) {
            if (isPortOpen("localhost", p, 350)) {
                return p;
            }
        }
        return 5432; // Fallback
    }

    private boolean isPortOpen(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
