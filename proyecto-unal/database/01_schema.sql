-- =====================================================================
-- Proyecto: Analisis de Modelos Matematicos - Universidad Nacional
-- Base de datos: PostgreSQL
-- Esquema: estrella (star schema) para analitica de matricula
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS unal;
SET search_path TO unal;

-- ---------------------------------------------------------------------
-- DIMENSIONES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dim_periodo (
    periodo_id      SERIAL PRIMARY KEY,
    anio             SMALLINT NOT NULL,
    semestre         SMALLINT NOT NULL CHECK (semestre IN (1,2)),
    UNIQUE (anio, semestre)
);

-- Dimension geografica reutilizable (rol: nacimiento / procedencia)
CREATE TABLE IF NOT EXISTS dim_geografia (
    geografia_id     SERIAL PRIMARY KEY,
    cod_departamento VARCHAR(10),
    departamento     VARCHAR(120) NOT NULL,
    cod_ciudad       VARCHAR(10),
    ciudad           VARCHAR(120) NOT NULL,
    longitud         NUMERIC(18,10),
    latitud          NUMERIC(18,10),
    UNIQUE (cod_departamento, cod_ciudad)
);

CREATE TABLE IF NOT EXISTS dim_sede (
    sede_id          SERIAL PRIMARY KEY,
    codigo_snies     VARCHAR(20) NOT NULL UNIQUE,
    nombre_sede      VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_facultad (
    facultad_id      SERIAL PRIMARY KEY,
    nombre_facultad  VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS dim_programa (
    programa_id      SERIAL PRIMARY KEY,
    codigo_snies     VARCHAR(20) NOT NULL,
    nombre_programa  VARCHAR(200) NOT NULL,
    area_snies       VARCHAR(200),
    codigo_cine_area VARCHAR(10),
    codigo_cine_disc VARCHAR(10),
    area_cine        VARCHAR(200),
    facultad_id      INTEGER REFERENCES dim_facultad(facultad_id),
    UNIQUE (codigo_snies, nombre_programa)
);

CREATE TABLE IF NOT EXISTS dim_admision (
    admision_id          SERIAL PRIMARY KEY,
    modalidad_admision   VARCHAR(60),   -- MOD_ADM
    tipo_admision        VARCHAR(60),   -- TIPO_ADM
    paes                 VARCHAR(200),
    peama                VARCHAR(200),
    mov_peama            VARCHAR(200),
    convenio             VARCHAR(200),
    tipo_convenio        VARCHAR(200),
    adm_peama_andina     VARCHAR(200),
    UNIQUE (modalidad_admision, tipo_admision, paes, peama, mov_peama, convenio, tipo_convenio, adm_peama_andina)
);

-- ---------------------------------------------------------------------
-- TABLA DE HECHOS: un registro = un estudiante matriculado en un periodo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_matricula (
    matricula_id         BIGSERIAL PRIMARY KEY,
    periodo_id           INTEGER NOT NULL REFERENCES dim_periodo(periodo_id),
    sede_admision_id     INTEGER REFERENCES dim_sede(sede_id),
    sede_matricula_id    INTEGER NOT NULL REFERENCES dim_sede(sede_id),
    facultad_id          INTEGER NOT NULL REFERENCES dim_facultad(facultad_id),
    programa_id          INTEGER NOT NULL REFERENCES dim_programa(programa_id),
    geografia_nac_id     INTEGER REFERENCES dim_geografia(geografia_id),
    geografia_proc_id    INTEGER REFERENCES dim_geografia(geografia_id),
    admision_id          INTEGER REFERENCES dim_admision(admision_id),

    tipo_nivel           VARCHAR(30) NOT NULL,   -- Pregrado / Posgrado
    nivel                VARCHAR(60) NOT NULL,   -- Pregrado, Maestria, Doctorado...
    nacionalidad         VARCHAR(60),
    codigo_pais_nac      VARCHAR(20),
    edad                 SMALLINT NOT NULL, -- CHECK (edad BETWEEN 10 AND 100) relajado: el Excel contiene -88 y otros sentinels
    sexo                 VARCHAR(20) NOT NULL,
    estrato              VARCHAR(30) NOT NULL,
    tipo_colegio         VARCHAR(30),            -- Oficial / Privado
    pbm                  NUMERIC(10,2),           -- puntaje basico de matricula
    matriculado_pvez     BOOLEAN NOT NULL,        -- MAT_PVEZ = 'Si'

    created_at           TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- INDICES para consultas analiticas frecuentes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fact_periodo         ON fact_matricula (periodo_id);
CREATE INDEX IF NOT EXISTS idx_fact_sede_mat         ON fact_matricula (sede_matricula_id);
CREATE INDEX IF NOT EXISTS idx_fact_facultad         ON fact_matricula (facultad_id);
CREATE INDEX IF NOT EXISTS idx_fact_programa         ON fact_matricula (programa_id);
CREATE INDEX IF NOT EXISTS idx_fact_geografia_proc   ON fact_matricula (geografia_proc_id);
CREATE INDEX IF NOT EXISTS idx_fact_admision         ON fact_matricula (admision_id);
CREATE INDEX IF NOT EXISTS idx_fact_pvez             ON fact_matricula (matriculado_pvez);
CREATE INDEX IF NOT EXISTS idx_fact_estrato          ON fact_matricula (estrato);

-- ---------------------------------------------------------------------
-- VISTAS ANALITICAS (usadas por modelos-service / dashboard)
-- ---------------------------------------------------------------------

-- Serie historica de matricula por periodo, sede y facultad (insumo Modelo 1: regresion)
CREATE OR REPLACE VIEW vw_matricula_periodo_sede AS
SELECT p.anio, p.semestre, s.nombre_sede, f.nombre_facultad, COUNT(*) AS total_matriculados
FROM fact_matricula m
JOIN dim_periodo p  ON p.periodo_id = m.periodo_id
JOIN dim_sede s     ON s.sede_id = m.sede_matricula_id
JOIN dim_facultad f ON f.facultad_id = m.facultad_id
GROUP BY p.anio, p.semestre, s.nombre_sede, f.nombre_facultad
ORDER BY p.anio, p.semestre;

-- Perfil de ingreso regional (insumo Modelo 2: clasificacion PEAMA/equidad)
CREATE OR REPLACE VIEW vw_perfil_admision_regional AS
SELECT g.departamento, g.ciudad, m.estrato, m.tipo_colegio, a.peama, a.modalidad_admision,
       COUNT(*) AS total
FROM fact_matricula m
JOIN dim_geografia g ON g.geografia_id = m.geografia_proc_id
JOIN dim_admision a  ON a.admision_id = m.admision_id
GROUP BY g.departamento, g.ciudad, m.estrato, m.tipo_colegio, a.peama, a.modalidad_admision;

-- Capacidad/demanda por facultad y sede (insumo Modelo 3: optimizacion de cupos)
CREATE OR REPLACE VIEW vw_demanda_facultad_sede AS
SELECT s.nombre_sede, f.nombre_facultad, p.anio, p.semestre,
       COUNT(*) FILTER (WHERE m.matriculado_pvez) AS nuevos,
       COUNT(*) AS total
FROM fact_matricula m
JOIN dim_sede s     ON s.sede_id = m.sede_matricula_id
JOIN dim_facultad f ON f.facultad_id = m.facultad_id
JOIN dim_periodo p  ON p.periodo_id = m.periodo_id
GROUP BY s.nombre_sede, f.nombre_facultad, p.anio, p.semestre;

-- Perfiles individuales anonimizados (insumo Modelo 4: clustering / simulacion)
CREATE OR REPLACE VIEW vw_perfiles_estudiantes AS
SELECT m.matricula_id, p.anio, p.semestre, m.edad, m.sexo, m.estrato, m.tipo_colegio,
       m.pbm, m.matriculado_pvez, s.nombre_sede, f.nombre_facultad
FROM fact_matricula m
JOIN dim_periodo p ON p.periodo_id = m.periodo_id
JOIN dim_sede s ON s.sede_id = m.sede_matricula_id
JOIN dim_facultad f ON f.facultad_id = m.facultad_id;

-- Detalle completo por registro, usado para listados y filtros en el frontend
CREATE OR REPLACE VIEW vw_matricula_detalle AS
SELECT m.matricula_id,
       p.anio, p.semestre,
       s.nombre_sede, f.nombre_facultad, pr.nombre_programa,
       m.tipo_nivel, m.nivel, m.edad, m.sexo, m.estrato, m.tipo_colegio, m.pbm,
       m.matriculado_pvez,
       gp.departamento AS departamento_procedencia, gp.ciudad AS ciudad_procedencia,
       ad.modalidad_admision, ad.tipo_admision, ad.peama, ad.convenio
FROM fact_matricula m
JOIN dim_periodo p     ON p.periodo_id = m.periodo_id
JOIN dim_sede s        ON s.sede_id = m.sede_matricula_id
JOIN dim_facultad f    ON f.facultad_id = m.facultad_id
JOIN dim_programa pr   ON pr.programa_id = m.programa_id
LEFT JOIN dim_geografia gp ON gp.geografia_id = m.geografia_proc_id
LEFT JOIN dim_admision ad  ON ad.admision_id = m.admision_id;
