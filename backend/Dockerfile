# Multi-stage Docker build for SwasthyaSaathi Spring Boot Backend on Render
# Automatically detects Root Context (.) vs Backend Context (backend/) using main/java signature
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy context into temporary folder to locate Java backend sources
COPY . /tmp_repo/

# Check for Java backend source signature (src/main/java)
RUN if [ -d /tmp_repo/backend/src/main/java ]; then \
      cp -r /tmp_repo/backend/src ./src && \
      cp /tmp_repo/backend/pom.xml ./pom.xml; \
    elif [ -d /tmp_repo/src/main/java ]; then \
      cp -r /tmp_repo/src ./src && \
      cp /tmp_repo/pom.xml ./pom.xml; \
    else \
      echo "ERROR: Java backend source files not found!" && exit 1; \
    fi && \
    rm -rf /tmp_repo

# Build production jar in non-interactive batch mode
RUN mvn clean package -DskipTests -B -ntp

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/swasthya-saathi-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
