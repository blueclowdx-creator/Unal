FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml /build/pom.xml
COPY eureka-server/pom.xml /build/eureka-server/pom.xml
COPY gateway-service/pom.xml /build/gateway-service/pom.xml
COPY matricula-service/pom.xml /build/matricula-service/pom.xml
COPY modelos-service/pom.xml /build/modelos-service/pom.xml
RUN mvn -q -N install
COPY . /build
ARG SERVICE_DIR
RUN mvn -q -pl ${SERVICE_DIR} -am package -DskipTests

FROM eclipse-temurin:17-jre
ARG SERVICE_DIR
WORKDIR /app
COPY --from=build /build/${SERVICE_DIR}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
