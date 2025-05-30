# Stage 1: Build the Spring Boot application
FROM maven:3.9.9-eclipse-temurin-17 AS backend-build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Build the frontend application
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 3: Final image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built backend JAR
COPY --from=backend-build /app/target/api-0.0.1-SNAPSHOT.jar ./app.jar

# Copy the built frontend
COPY --from=frontend-build /app/build ./static

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Expose the port
EXPOSE 8082

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 