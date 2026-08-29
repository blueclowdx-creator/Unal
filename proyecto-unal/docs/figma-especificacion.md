# Especificación de diseño para Figma
## Proyecto: Analítica de Matrícula UNAL

> Nota importante: Claude no tiene la capacidad de generar archivos binarios `.fig`
> directamente (no existe una API de escritura de archivos Figma disponible aquí). Este
> documento es un **brief de diseño listo para construir**: define tokens, pantallas, layout
> exacto y contenido real, de modo que armar el archivo en Figma sea un ejercicio de
> "seguir la receta" (o puedes pegar este documento en el modo "First Draft" / plugins de
> generación de Figma, que sí aceptan specs en texto). El frontend Angular ya construido
> (`frontend/`) sigue exactamente este mismo sistema de diseño, así que también puedes usarlo
> como referencia visual viva (`npm start`) mientras maquetas en Figma.

---

## 1. Sistema de diseño (Design Tokens)

### Paleta de color
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#F6F4EE` | Fondo general (papel) |
| `surface` | `#FFFFFF` | Tarjetas, paneles |
| `primary` | `#1F4D3D` | Verde institucional — botones, títulos, sidebar |
| `primary-dark` | `#133227` | Sidebar, hover de botones |
| `accent` | `#C98A2C` | Ocre/dorado — línea de proyección, énfasis, badges de curso |
| `ink` | `#14201C` | Texto principal |
| `muted` | `#6B7A73` | Texto secundario, etiquetas |
| `line` | `#DDD8CB` | Bordes, divisores |
| `alert` | `#A8432A` | Errores, alertas (uso puntual) |
| `info-bg` | `#EAF0EC` | Fondos de nota / hover de tabla |

### Tipografía
- **Display (títulos)**: Fraunces — Semibold/Bold, tracking ligeramente negativo.
- **Cuerpo / UI**: Inter — Regular 400 / Medium 500 / Semibold 600.
- **Datos / mono (números, códigos de curso, etiquetas técnicas)**: JetBrains Mono.

Escala tipográfica: H1 32px / H2 24px / H3 18px / body 15px / caption-mono 12px.

### Elemento firma (signature element)
Etiquetas tipo **"código de curso universitario"**: pastilla verde oscuro con texto ocre en
mono, ej. `MOD-01`, `MOD-02`. Aparece en el encabezado de cada pantalla y en el menú lateral,
como si cada modelo matemático fuera una asignatura del catálogo académico de la universidad.

### Componentes base a crear en Figma (Design System page)
- Botón primario / deshabilitado
- Input de texto, Select, Campo con label mono
- Tarjeta (card) con sombra sutil (`0 4px 16px rgba(20,32,28,0.05)`), radio 10px
- Tabla de datos (header mono uppercase, hover `info-bg`)
- Badge / pill
- KPI card (número grande Fraunces + etiqueta mono debajo)
- Nota/callout con borde izquierdo ocre

---

## 2. Arquitectura de pantallas (frames)

Crea un frame por pantalla a 1440×1024 (desktop) y una variante mobile a 390×844 para el
Dashboard y el listado de Matrículas (las 2 pantallas de mayor uso).

```
Página Figma "01 - Design System"   -> tokens y componentes base
Página Figma "02 - Desktop Flows"   -> las 6 pantallas principales
Página Figma "03 - Mobile"          -> 2 variantes responsivas clave
```

### Layout maestro (todas las pantallas)
```
┌───────────────┬──────────────────────────────────────────────┐
│  SIDEBAR       │  MAIN CONTENT                                 │
│  248px fijo    │  padding 40px, max-width 1180px, centrado     │
│  fondo         │                                                │
│  primary-dark  │                                                │
│                │                                                │
│  Panel general │                                                │
│  Registros     │                                                │
│  ── Modelos ── │                                                │
│  MOD-01 ...    │                                                │
│  MOD-02 ...    │                                                │
│  MOD-03 ...    │                                                │
│  MOD-04 ...    │                                                │
└───────────────┴──────────────────────────────────────────────┘
```

### Pantalla 1 — Panel general (Dashboard)
- Header: badge `PANEL GENERAL` + H1 "Analítica de matrícula · Universidad Nacional"
- Nota callout: contexto del dataset (137.283 registros, 2019-2023)
- Fila de 4 KPI cards: Matrículas registradas / Sedes activas / Facultades / Periodos
- Card ancho completo: gráfico de línea de la serie histórica total por periodo

### Pantalla 2 — Registros de matrícula
- Header: badge `REGISTROS` + H1
- Formulario horizontal de filtros: Año, Semestre, Sede, Facultad, Sexo + botón "Filtrar"
- Card con tabla: Periodo / Sede / Facultad / Programa / Edad / Sexo / Estrato / Nuevo
- Paginador simple (Anterior / Siguiente + "Página X de Y")

### Pantalla 3 — MOD-01 Regresión (Demanda futura)
- Header: badge `MOD-01 · REGRESIÓN` + H1 "Proyección de demanda de matrícula"
- Nota explicando el objetivo del modelo (una frase, tono directo)
- Formulario: Sede (texto opcional), Periodos futuros (número) + botón "Calcular proyección"
- 3 KPI cards: Pendiente / Intercepto / R²
- Card: gráfico de línea con dos series (histórico sólido verde, proyección punteada ocre) +
  leyenda

### Pantalla 4 — MOD-02 Clasificación (Equidad regional)
- Header: badge `MOD-02 · CLASIFICACIÓN` + H1
- Formulario: Select Estrato, Select Tipo de colegio + botón "Estimar probabilidad"
- KPI card grande: probabilidad estimada (%)
- Card lateral: tabla de coeficientes del modelo (b0, b_estrato, b_colegio, grupos de
  entrenamiento)

### Pantalla 5 — MOD-03 Optimización (Cupos)
- Header: badge `MOD-03 · OPTIMIZACIÓN` + H1
- Formulario: Sede opcional, Cupos totales + botón "Optimizar"
- Card: gráfico de barras horizontales (una barra por facultad, longitud = cupos asignados)
- Card: tabla detalle (Facultad / Demanda histórica / Peso equidad / Cupos asignados)

### Pantalla 6 — MOD-04 Clustering + Monte Carlo
- Header: badge `MOD-04 · CLUSTERING + MC` + H1
- Card A "Segmentación (K-Means)": formulario (k, muestra) + tabla de clusters (tamaño, edad
  prom., estrato prom., PBM prom., % colegio oficial)
- Card B "Simulación de Monte Carlo": formulario (periodos futuros, iteraciones) + nota mono
  con tasa de crecimiento histórica + tabla de escenarios P10/P50/P90 por periodo futuro

---

## 3. Flujo de usuario (user flow, para el prototipo interactivo de Figma)

```
Panel general ──> Registros de matrícula ──> (filtra y explora)
      │
      └──> MOD-01 Regresión ──> MOD-02 Clasificación ──> MOD-03 Optimización ──> MOD-04 Clustering+MC
             (navegación libre entre los 4 vía sidebar, no es un wizard lineal)
```

Conecta en Figma cada botón "Calcular / Estimar / Optimizar / Segmentar / Simular" con una
variante del mismo frame que muestra el estado "con resultados" (usa Component Variants:
`estado=vacío / cargando / con-resultados / error`, como ya maneja el Angular real).

---

## 4. Copys reales a usar (evitar lorem ipsum)

- Nota del dashboard: *"Datos de matrícula 2019–2023 (137.283 registros). Este panel resume
  el comportamiento histórico; los 4 modelos matemáticos del menú lateral generan
  proyecciones y recomendaciones a partir de esta misma base."*
- Estado de error genérico: *"No fue posible ejecutar el modelo. Verifica que los
  microservicios estén disponibles."*
- Estado de carga: *"Calculando modelo…" / "Resolviendo el problema de optimización…" /
  "Ejecutando K-Means…" / "Ejecutando simulación…"*

---

## 5. Cómo pasar esto a Figma rápidamente

1. Crea un archivo nuevo, pega la paleta como Color Styles y las tipografías como Text Styles.
2. Construye el Design System (componentes de la sección 1) como Figma Components con
   variantes.
3. Arma el layout maestro (sidebar + main) como un Frame reutilizable / Figma "Section".
4. Duplica el layout maestro por cada una de las 6 pantallas y coloca el contenido descrito.
5. Si tienes acceso a Figma AI "First Draft": puedes pegar directamente las secciones 2 y 4
   de este documento como prompt, ya que describen contenido y estructura reales.
