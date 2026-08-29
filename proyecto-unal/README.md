# Analítica de Matrícula — Universidad Nacional de Colombia

Proyecto de análisis con modelos matemáticos sobre datos reales de matrícula UNAL
(2019–2023, 137.283 registros). Arquitectura de microservicios: PostgreSQL → Spring Boot →
Angular, contenerizada con Docker y pensada para desplegar en nube.

## Arquitectura

```
                         ┌───────────────┐
                         │   Angular     │  (puerto 4200 / 80 en prod)
                         │   Frontend    │
                         └───────┬───────┘
                                 │ /api/**
                         ┌───────▼───────┐
                         │ Gateway (8080)│  Spring Cloud Gateway
                         └───┬───────┬───┘
                 ┌───────────┘       └───────────┐
        ┌────────▼────────┐          ┌───────────▼─────────┐
        │ matricula-service │◄────────│  modelos-service     │
        │     (8081)        │ (WebClient, vía Eureka)        │
        └────────┬──────────┘         └───────────┬──────────┘
                  │ JDBC/JPA                        │
                  ▼                                  │
           ┌─────────────┐                           │
           │ PostgreSQL   │                           │
           │  (5432)      │                           │
           └─────────────┘                            │
                  ▲                                    │
                  └── ambos se registran en ──► Eureka Server (8761)
```

- **matricula-service**: única capa que toca la base de datos; expone datos crudos (paginados
  y filtrados) y vistas agregadas.
- **modelos-service**: no tiene base de datos propia; consume los agregados de
  `matricula-service` vía HTTP (service discovery con Eureka) y calcula los 4 modelos
  matemáticos (ver `docs/modelos-matematicos.md`).
- **gateway-service**: único punto de entrada HTTP para el frontend.

## Estructura del repositorio

```
proyecto-unal/
├── database/
│   ├── 01_schema.sql                  # esquema estrella PostgreSQL + vistas analíticas
│   └── etl_load_excel_to_postgres.py  # carga el Excel real a PostgreSQL
├── backend/
│   ├── pom.xml                        # POM padre (multi-módulo Maven)
│   ├── eureka-server/
│   ├── gateway-service/
│   ├── matricula-service/
│   └── modelos-service/
├── frontend/                          # Angular 17 standalone
├── docs/
│   ├── modelos-matematicos.md         # fundamento matemático de los 4 modelos
│   └── figma-especificacion.md        # brief de diseño para construir el Figma
└── docker-compose.yml
```

## Ejecución local (Docker Compose — recomendado)

Requisitos: Docker y Docker Compose instalados.

```bash
cd proyecto-unal

# 1. Levantar toda la plataforma (Postgres, Eureka, Gateway, microservicios, frontend)
docker compose up --build -d

# 2. Cargar los datos reales del Excel a PostgreSQL (una sola vez)
pip install pandas openpyxl sqlalchemy psycopg2-binary --break-system-packages
python database/etl_load_excel_to_postgres.py \
    --excel /ruta/a/Bd_Universidad_Nacional.xlsx \
    --db-url postgresql+psycopg2://unal_user:unal_pass@localhost:5432/unal_db
```

Accesos:
- Frontend: http://localhost:4200
- Gateway (API): http://localhost:8080/api/...
- Eureka dashboard: http://localhost:8761
- PostgreSQL: localhost:5432 (db `unal_db`, user `unal_user`, pass `unal_pass`)

> El esquema (`01_schema.sql`) se ejecuta automáticamente al crear el contenedor de Postgres
> (está montado en `/docker-entrypoint-initdb.d`). Si vuelves a levantar el proyecto con un
> volumen ya existente, el esquema no se re-ejecuta; usa `docker compose down -v` para reset
> total.

## Ejecución local sin Docker (desarrollo)

**Base de datos:**
```bash
psql -U postgres -c "CREATE DATABASE unal_db;"
psql -U postgres -c "CREATE USER unal_user WITH PASSWORD 'unal_pass';"
psql -U postgres -d unal_db -f database/01_schema.sql
python database/etl_load_excel_to_postgres.py --excel <ruta.xlsx> \
    --db-url postgresql+psycopg2://unal_user:unal_pass@localhost:5432/unal_db
```

**Backend** (requiere JDK 17 y Maven; se compila desde `backend/`):
```bash
cd backend
mvn -pl eureka-server spring-boot:run &
mvn -pl gateway-service spring-boot:run &
mvn -pl matricula-service spring-boot:run &
mvn -pl modelos-service spring-boot:run &
```

**Frontend** (requiere Node 20+):
```bash
cd frontend
npm install
npm start   # http://localhost:4200, apunta a http://localhost:8080/api
```

## Despliegue en la nube

El proyecto está desacoplado en contenedores independientes, por lo que se adapta a
cualquiera de estas rutas:

### Opción simple — un solo VPS/instancia (Render, DigitalOcean, EC2)
Sube el repositorio y corre `docker compose up --build -d` directamente en la instancia.
Expón solo los puertos 4200 (o 80, ajustando `docker-compose.yml`) y usa un proxy
(Caddy/Nginx/Traefik) con TLS delante del frontend.

### Opción gestionada — servicios separados (AWS / GCP / Render por servicio)
- **PostgreSQL**: usa un servicio gestionado (Amazon RDS, Cloud SQL, Render Postgres) en
  lugar del contenedor `postgres` de compose. Corre el ETL apuntando a esa instancia.
- **eureka-server, gateway-service, matricula-service, modelos-service**: cada uno es una
  imagen Docker independiente (ya tienen su `Dockerfile`); despliega cada una como un servicio
  de contenedor (AWS ECS/Fargate, Google Cloud Run, Render Web Service). Ajusta las variables
  de entorno `EUREKA_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` según el
  proveedor.
- **frontend**: build estático (`npm run build`) servible desde cualquier hosting estático
  (Vercel, Netlify, S3+CloudFront, Cloud Storage) o como contenedor Nginx igual que en
  compose; solo actualiza `environment.prod.ts` con la URL pública del gateway.

### Variables de entorno relevantes por servicio
| Servicio | Variables |
|---|---|
| matricula-service | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `EUREKA_URL` |
| modelos-service | `EUREKA_URL` |
| gateway-service | `EUREKA_URL` |
| eureka-server | (ninguna obligatoria) |
| frontend | URL del gateway embebida en build (`environment.prod.ts`) o proxy Nginx |

## Modelos matemáticos incluidos

Ver detalle completo (formulación, objetivo, librerías) en `docs/modelos-matematicos.md`:

1. **Regresión lineal** — proyección de demanda de matrícula.
2. **Clasificación (regresión logística agregada)** — equidad regional de ingreso (PEAMA).
3. **Optimización lineal (Simplex)** — asignación de cupos nuevos por facultad.
4. **Clustering (K-Means) + Simulación de Monte Carlo** — segmentación de perfiles y
   escenarios futuros de matrícula.

## Diseño / Figma

Este repositorio no incluye un archivo `.fig` (no es un formato que se pueda generar
directamente), pero sí una especificación de diseño completa y lista para construir en
`docs/figma-especificacion.md` (paleta, tipografía, layout exacto de cada pantalla y copys
reales). El frontend Angular ya construido sigue el mismo sistema de diseño, así que también
sirve como referencia visual mientras maquetas.

## Notas de verificación

- El **frontend Angular fue compilado exitosamente** (`ng build`) como parte de la
  construcción de este proyecto.
- El **backend Spring Boot** no pudo compilarse dentro de este entorno porque no tiene acceso
  de red a Maven Central; el código fue escrito y revisado manualmente, pero se recomienda
  correr `mvn -q -pl <modulo> -am compile` la primera vez que lo levantes localmente para
  detectar cualquier ajuste menor de dependencias.
- El **ETL** no pudo ejecutarse contra una instancia real de PostgreSQL dentro de este entorno
  (no hay un servidor Postgres disponible aquí); su lógica fue validada leyendo y perfilando
  el Excel real directamente con pandas.
