# Universal Dockerfile for SwasthyaSaathi Spring Boot Backend on Render
# Compatible with both Root Context (.) and Backend Context (backend/)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml safely regardless of context
COPY backend/pom.xml* pom.xml ./
RUN if [ -f backend/pom.xml ]; then mv backend/pom.xml ./pom.xml; fi

# Copy src directory safely regardless of context
COPY backend/src* src ./src_backend/
RUN if [ -d src_backend/backend/src ]; then mv src_backend/backend/src ./src && rm -rf src_backend; else mv src_backend ./src; fi

# Build production jar
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/swasthya-saathi-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
