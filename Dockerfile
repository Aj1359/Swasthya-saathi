# Multi-stage Docker build for SwasthyaSaathi Spring Boot Backend on Render
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/swasthya-saathi-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
