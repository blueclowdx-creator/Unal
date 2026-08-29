export interface MatriculaDetalle {
  matriculaId: number;
  anio: number;
  semestre: number;
  nombreSede: string;
  nombreFacultad: string;
  nombrePrograma: string;
  tipoNivel: string;
  nivel: string;
  edad: number;
  sexo: string;
  estrato: string;
  tipoColegio: string;
  pbm: number;
  matriculadoPvez: boolean;
  departamentoProcedencia: string;
  ciudadProcedencia: string;
  modalidadAdmision: string;
  tipoAdmision: string;
  peama: string;
  convenio: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface MatriculaPeriodoSede {
  anio: number;
  semestre: number;
  sede: string;
  facultad: string;
  total: number;
}

// ---------- Modelo 1: Regresion ----------
export interface PuntoSerie { anio: number; semestre: number; total: number; proyectado: boolean; }
export interface ResultadoRegresion {
  sedeFiltrada: string | null;
  pendiente: number;
  intercepto: number;
  r2: number;
  historico: PuntoSerie[];
  proyeccion: PuntoSerie[];
}

// ---------- Modelo 2: Clasificacion ----------
export interface Coeficientes { b0: number; bEstrato: number; bColegioOficial: number; iteraciones: number; tasaAprendizaje: number; }
export interface ResultadoClasificacion {
  coeficientes: Coeficientes;
  probabilidadEstimada: number;
  estrato: string;
  tipoColegio: string;
  muestrasEntrenamiento: number;
}

// ---------- Modelo 3: Optimizacion ----------
export interface AsignacionFacultad { facultad: string; demandaHistoricaPromedio: number; pesoEquidad: number; cuposAsignados: number; }
export interface ResultadoOptimizacion {
  sede: string | null;
  cuposTotales: number;
  valorObjetivo: number;
  asignaciones: AsignacionFacultad[];
}

// ---------- Modelo 4: Clustering + Monte Carlo ----------
export interface Cluster { id: number; tamano: number; edadPromedio: number; estratoPromedio: number; pbmPromedio: number; proporcionOficial: number; }
export interface ResultadoClustering { k: number; muestrasUsadas: number; clusters: Cluster[]; }

export interface EscenarioPeriodo { indicePeriodo: number; p10: number; p50: number; p90: number; }
export interface ResultadoSimulacion {
  tasaCrecimientoMedia: number;
  tasaCrecimientoDesv: number;
  matriculaBase: number;
  iteraciones: number;
  escenarios: EscenarioPeriodo[];
}
