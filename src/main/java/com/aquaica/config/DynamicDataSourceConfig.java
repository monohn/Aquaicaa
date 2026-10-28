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
