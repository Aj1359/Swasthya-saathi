# Universal Multi-stage Docker build for SwasthyaSaathi Spring Boot Backend on Render
# Compatible with both Root Context (.) and Backend Subdirectory Context (backend/)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml safely regardless of context
COPY backend/pom.xml* pom.xml* ./
RUN if [ -f backend/pom.xml ]; then mv backend/pom.xml ./pom.xml; fi

# Copy src directory safely regardless of context
COPY backend/src* src* ./src_tmp/
RUN if [ -d src_tmp/backend/src ]; then mv src_tmp/backend/src ./src; else mv src_tmp/* ./src; fi && rm -rf src_tmp

# Build production jar
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/swasthya-saathi-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
