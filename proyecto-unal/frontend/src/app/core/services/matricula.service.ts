import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MatriculaDetalle, MatriculaPeriodoSede, PageResponse } from '../models/models';

export interface Catalogos {
  anios: number[];
  semestres: number[];
  sedes: string[];
  facultades: string[];
  sexos: string[];
  estratos: string[];
  tiposColegio: string[];
  programas: string[];
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private base = `${environment.apiBaseUrl}/matriculas`;

  constructor(private http: HttpClient) {}

  listar(filtros: {
    anio?: number; semestre?: number; sede?: string; facultad?: string;
    sexo?: string; estrato?: string; page?: number; size?: number;
  }): Observable<PageResponse<MatriculaDetalle>> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, v as any);
    });
    return this.http.get<PageResponse<MatriculaDetalle>>(this.base, { params });
  }

  statsPorPeriodoSede(): Observable<MatriculaPeriodoSede[]> {
    return this.http.get<MatriculaPeriodoSede[]>(`${this.base}/stats/por-periodo-sede`);
  }

  catalogos(): Observable<Catalogos> {
    return this.http.get<Catalogos>(`${this.base}/catalogos`).pipe(
      map(c => ({ ...c, sedes: this.limpiarSedes(c.sedes) }))
    );
  }

  /** Devuelve las sedes con suficientes datos para modelos predictivos (>= 2 periodos historicos) */
  sedesParaModelos(): string[] {
    return ['Bogotá', 'Medellín', 'Manizales', 'Palmira', 'Amazonía', 'Caribe', 'Orinoquía', 'Tumaco'];
  }

  /** Quita De La Paz de cualquier lista de sedes (solo 1 periodo de datos, insuficiente para modelos) */
  private limpiarSedes(sedes: string[]): string[] {
    return sedes.filter(s => s !== 'De La Paz');
  }
}
