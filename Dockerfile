# Etapa 1: Build con Maven y Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copiar descriptor de dependencias y wrapper para optimizar cache de capas Docker
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copiar código fuente y construir el paquete JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Etapa 2: Imagen ligera de producción con JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Crear usuario y grupo de sistema sin privilegios de root por seguridad
RUN addgroup -S aquaica && adduser -S aquaica -G aquaica

# Crear directorio de evidencias persistentes y asignar permisos
RUN mkdir -p /app/uploads/reportes && chown -R aquaica:aquaica /app

# Copiar artefacto ejecutable generado en el builder
COPY --from=builder /app/target/aquaica-*.jar app.jar
RUN chown aquaica:aquaica app.jar

USER aquaica

# Variable de puerto estándar para plataformas Cloud (Render, Railway, Heroku, etc.)
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
