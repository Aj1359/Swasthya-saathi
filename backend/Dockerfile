# Universal Dockerfile for SwasthyaSaathi Spring Boot Backend on Render
# Compatible with both Root Context (.) and Backend Subdirectory Context (backend/)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml safely using wildcards on all sources
COPY backend/pom.xml* pom.xml* ./
RUN if [ -f backend/pom.xml ]; then mv backend/pom.xml ./pom.xml; fi

# Copy src directory safely using wildcards on all sources
COPY backend/src* ./backend_src/
COPY src* ./direct_src/
RUN if [ -d backend_src/src ]; then mv backend_src/src ./src; elif [ -d direct_src/src ]; then mv direct_src/src ./src; elif [ -d direct_src ]; then mv direct_src ./src; fi && rm -rf backend_src direct_src

# Build production jar in non-interactive batch mode
RUN mvn clean package -DskipTests -B -ntp

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/swasthya-saathi-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
