import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ResultadoRegresion, ResultadoClasificacion, ResultadoOptimizacion,
  ResultadoClustering, ResultadoSimulacion
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ModelosService {
  private base = `${environment.apiBaseUrl}/modelos`;

  constructor(private http: HttpClient) {}

  proyeccionRegresion(sede: string | null, periodosFuturos: number): Observable<ResultadoRegresion> {
    let params = new HttpParams().set('periodosFuturos', periodosFuturos);
    if (sede) params = params.set('sede', sede);
    return this.http.get<ResultadoRegresion>(`${this.base}/regresion/proyeccion`, { params });
  }

  equidadClasificacion(estrato: string, tipoColegio: string): Observable<ResultadoClasificacion> {
    const params = new HttpParams().set('estrato', estrato).set('tipoColegio', tipoColegio);
    return this.http.get<ResultadoClasificacion>(`${this.base}/clasificacion/equidad`, { params });
  }

  optimizarCupos(sede: string | null, cuposTotales: number): Observable<ResultadoOptimizacion> {
    let params = new HttpParams().set('cuposTotales', cuposTotales);
    if (sede) params = params.set('sede', sede);
    return this.http.get<ResultadoOptimizacion>(`${this.base}/optimizacion/cupos`, { params });
  }

  clustering(k: number, muestra: number): Observable<ResultadoClustering> {
    const params = new HttpParams().set('k', k).set('muestra', muestra);
    return this.http.get<ResultadoClustering>(`${this.base}/clustering/perfiles`, { params });
  }

  monteCarlo(periodosFuturos: number, iteraciones: number): Observable<ResultadoSimulacion> {
    const params = new HttpParams().set('periodosFuturos', periodosFuturos).set('iteraciones', iteraciones);
    return this.http.get<ResultadoSimulacion>(`${this.base}/simulacion/montecarlo`, { params });
  }
}
