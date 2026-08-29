# Modelos matemáticos — Analítica de Matrícula UNAL

Fuente de datos: `Bd_Universidad_Nacional.xlsx` — 137.283 registros de matrícula,
periodos 2019-1 a 2023-2 (sedes, facultades, programas, procedencia geográfica, estrato,
tipo de colegio, PBM, modalidad de admisión).

Se implementaron 4 modelos de naturaleza distinta (estadístico, optimización, clasificación,
simulación), cada uno con un objetivo de negocio claro y accionable.

---

## Modelo 1 — Regresión lineal simple (serie de tiempo)
**Servicio:** `modelos-service` → `RegresionService`
**Endpoint:** `GET /api/modelos/regresion/proyeccion?sede=&periodosFuturos=`

**Objetivo:** proyectar la demanda futura de cupos de matrícula (número de estudiantes) por
periodo académico, para apoyar la planeación de capacidad instalada (aulas, docentes,
recursos de bienestar).

**Formulación:**
- Variable independiente `t`: índice secuencial de periodo (0, 1, 2, … por semestre).
- Variable dependiente `y`: total de estudiantes matriculados en ese periodo.
- Ajuste por mínimos cuadrados ordinarios: `y = β₀ + β₁·t`
- Se reporta `β₁` (pendiente = crecimiento neto de estudiantes por semestre), `β₀`
  (intercepto) y `R²` (bondad de ajuste).
- Proyección: se extrapola `y` para los `N` periodos futuros solicitados.

**Limitación reconocida:** un modelo lineal no captura estacionalidad ni choques externos
(ej. pandemia, paros); se documenta como aproximación de tendencia, no pronóstico exacto.

---

## Modelo 2 — Clasificación: regresión logística agregada
**Servicio:** `modelos-service` → `ClasificacionService`
**Endpoint:** `GET /api/modelos/clasificacion/equidad?estrato=&tipoColegio=`

**Objetivo:** estimar la probabilidad de que un perfil de ingreso corresponda a la modalidad
de admisión regional **PEAMA**, en función del estrato socioeconómico y el tipo de colegio de
procedencia (oficial/privado). Es un insumo para identificar brechas de acceso territorial y
apoyar decisiones de política de equidad.

**Formulación:**
- `P(PEAMA=Sí | estrato, colegio) = σ(β₀ + β₁·estrato + β₂·esOficial)`, con
  `σ(z) = 1 / (1 + e⁻ᶻ)`
- Como los datos disponibles ya están agregados por combinación (estrato × tipo de colegio ×
  modalidad), se entrena una **regresión logística binomial ponderada por frecuencia**: cada
  combinación aporta su conteo observado como peso en el gradiente (equivalente a expandir el
  agregado en observaciones individuales, sin necesidad de manejar microdatos row-by-row).
- Optimización por descenso de gradiente (2000 iteraciones, tasa de aprendizaje 0.01).

---

## Modelo 3 — Optimización lineal (Simplex)
**Servicio:** `modelos-service` → `OptimizacionService` (Apache Commons Math3 `SimplexSolver`)
**Endpoint:** `GET /api/modelos/optimizacion/cupos?sede=&cuposTotales=`

**Objetivo:** distribuir un número total de cupos nuevos disponibles entre las facultades de
una sede, **maximizando la equidad de cobertura**: se prioriza a las facultades que
históricamente han tenido menor participación relativa de estudiantes nuevos.

**Formulación:**
```
max   Σ wᵢ·xᵢ
s.a.  Σ xᵢ ≤ cuposTotales
      0 ≤ xᵢ ≤ demandaHistóricaᵢ      (para cada facultad i)
```
- `demandaHistóricaᵢ`: promedio histórico de estudiantes nuevos matriculados en la facultad i
  (evita asignar cupos que la facultad no podría cubrir realmente).
- `wᵢ = 1 / (participaciónᵢ + 0.01)`: peso de equidad, inversamente proporcional a la
  participación histórica relativa de la facultad — el término `+0.01` evita división por
  cero y modera el peso de facultades con participación cercana a cero.
- Resuelto con el método Simplex de Apache Commons Math3.

---

## Modelo 4 — Clustering (K-Means) + Simulación de Monte Carlo
**Servicio:** `modelos-service` → `ClusteringSimulacionService`
**Endpoints:** `GET /api/modelos/clustering/perfiles?k=&muestra=` ·
`GET /api/modelos/simulacion/montecarlo?periodosFuturos=&iteraciones=`

### 4a. Clustering — K-Means
**Objetivo:** segmentar los perfiles de estudiantes matriculados en grupos característicos
(por edad, estrato, PBM y tipo de colegio), para apoyar el diseño de políticas de bienestar y
permanencia diferenciadas por segmento (ej. becas, acompañamiento psicosocial, tutorías).

- Vector de características por estudiante: `[edad, estrato_numérico, PBM, esColegioOficial]`
- Algoritmo: K-Means++ (Apache Commons Math3 `KMeansPlusPlusClusterer`), `k` configurable.
- Salida: centroide y tamaño de cada clúster.

### 4b. Simulación de Monte Carlo
**Objetivo:** proyectar escenarios futuros de matrícula total ante incertidumbre, generando
percentiles (P10 pesimista / P50 esperado / P90 optimista) en lugar de un único número
determinístico como en el Modelo 1.

- Se calcula la tasa de crecimiento semestral histórica observada: media `μ` y desviación
  estándar `σ`.
- Se simulan `M` trayectorias aleatorias: en cada periodo futuro, `valorₜ = valorₜ₋₁ · (1 +
  shock)`, con `shock ~ N(μ, σ)`.
- Se reportan los percentiles 10, 50 y 90 de la distribución resultante para cada periodo
  futuro.

---

## Resumen de técnicas usadas
| Modelo | Familia | Técnica | Libería |
|---|---|---|---|
| 1 | Estadística / predictivo | Regresión lineal (MCO) | Apache Commons Math3 `SimpleRegression` |
| 2 | Clasificación | Regresión logística (descenso de gradiente) | implementación propia |
| 3 | Optimización | Programación lineal (Simplex) | Apache Commons Math3 `SimplexSolver` |
| 4a | No supervisado | Clustering K-Means++ | Apache Commons Math3 `KMeansPlusPlusClusterer` |
| 4b | Simulación | Monte Carlo (muestreo aleatorio) | implementación propia + `DescriptiveStatistics` |
