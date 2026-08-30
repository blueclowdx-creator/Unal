# Etapa 1: build con Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
# Cambia "eureka-server" por el módulo que quieras construir en cada servicio
ARG MODULE=eureka-server
RUN mvn clean package -pl ${MODULE} -am -DskipTests

# Etapa 2: imagen final, más liviana, solo con el jar
FROM eclipse-temurin:17-jre
WORKDIR /app
ARG MODULE=eureka-server
COPY --from=build /app/${MODULE}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
