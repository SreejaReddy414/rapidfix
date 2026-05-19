# Stage 1 — Build the jar
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first (Docker caches this layer separately)
# So if only source code changes, Maven doesn't re-download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2 — Run the jar
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy only the built jar from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p logs

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]