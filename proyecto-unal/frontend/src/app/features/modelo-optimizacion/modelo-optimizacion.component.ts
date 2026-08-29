import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelosService } from '../../core/services/modelos.service';
import { MatriculaService } from '../../core/services/matricula.service';
import { ResultadoOptimizacion } from '../../core/models/models';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';

@Component({
  selector: 'app-modelo-optimizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BarChartComponent],
  template: `
    <span class="course-code">MOD-03 · OPTIMIZACIÓN</span>
    <h1>Asignación óptima de cupos nuevos por facultad</h1>
    <p class="note">
      Resuelve un problema de programación lineal (método Simplex): maximiza la asignación de
      cupos priorizando facultades con menor participación histórica de estudiantes nuevos
      (equidad), sin exceder ni la demanda histórica de cada facultad ni el total de cupos
      disponibles.
    </p>

    <form class="model-form" (ngSubmit)="ejecutar()">
      <div class="field">
        <label>Sede (opcional)</label>
        <select [(ngModel)]="sede" name="sede">
          <option [ngValue]="''">Todas las sedes</option>
          <option *ngFor="let s of sedes" [value]="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>Cupos totales a distribuir</label>
        <input type="number" [(ngModel)]="cuposTotales" name="cuposTotales" min="1" />
      </div>
      <button class="btn" type="submit">Optimizar</button>
    </form>

    <div class="loading" *ngIf="cargando">Resolviendo el problema de optimización…</div>
    <div class="error" *ngIf="error">No fue posible ejecutar el modelo. Verifica los microservicios.</div>

    <div class="grid grid-3" *ngIf="resultado && !cargando">
      <div class="card kpi">
        <span class="kpi__value">{{ resumenKpi.cuposAsignados }}</span>
        <span class="kpi__label">Cupos asignados (sobre {{ resultado.cuposTotales }} solicitados)</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ resultado.valorObjetivo | number:'1.2-2' }}</span>
        <span class="kpi__label">Valor objetivo (índice de equidad)</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ resumenKpi.facultadesAtendidas }} / {{ resultado.asignaciones.length }}</span>
        <span class="kpi__label">Facultades con cupos asignados</span>
      </div>
    </div>

    <div class="card" *ngIf="resultado && !cargando">
      <h3>Asignación resultante {{ resultado.sede ? '— ' + resultado.sede : '(todas las sedes)' }}</h3>
      <p class="mono" style="font-size:0.8rem; color:var(--color-muted);">
        Valor objetivo: {{ resultado.valorObjetivo | number:'1.2-2' }} · Cupos totales: {{ resultado.cuposTotales }}
      </p>
      <app-bar-chart [datos]="datosBarras"></app-bar-chart>
    </div>

    <div class="card" *ngIf="resultado && !cargando">
      <h3>Detalle por facultad</h3>
      <table class="data-table">
        <thead><tr><th>Facultad</th><th>Demanda histórica prom.</th><th>Peso equidad</th><th>Cupos asignados</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of resultado.asignaciones">
            <td>{{ a.facultad }}</td>
            <td class="mono">{{ a.demandaHistoricaPromedio | number:'1.1-1' }}</td>
            <td class="mono">{{ a.pesoEquidad | number:'1.2-2' }}</td>
            <td class="mono">{{ a.cuposAsignados }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card conclusion" *ngIf="resultado && !cargando && conclusion">
      <h3>Resultado y conclusión</h3>
      <p class="lead" [innerHTML]="conclusion.lead"></p>
      <p [innerHTML]="conclusion.texto"></p>
      <ul>
        <li *ngFor="let r of conclusion.recomendaciones" [innerHTML]="r"></li>
      </ul>
    </div>
  `,
  styles: [`
    .conclusion { border-left: 4px solid var(--color-accent); }
    .conclusion p { margin: 0 0 10px 0; }
    .conclusion .lead { font-size: 1.05rem; line-height: 1.5; }
    .conclusion ul { margin: 8px 0; padding-left: 20px; }
    .conclusion li { margin: 4px 0; line-height: 1.5; }
  `]
})
export class ModeloOptimizacionComponent implements OnInit {
  sede = '';
  cuposTotales = 500;
  resultado?: ResultadoOptimizacion;
  datosBarras: { label: string; value: number }[] = [];
  resumenKpi = { cuposAsignados: 0, facultadesAtendidas: 0 };
  conclusion?: { lead: string; texto: string; recomendaciones: string[] };
  cargando = false;
  error = false;
  sedes: string[] = [];

  constructor(
    private modelosService: ModelosService,
    private matriculaService: MatriculaService
  ) {}

  ngOnInit(): void {
    this.matriculaService.catalogos().subscribe({
      next: (c) => { this.sedes = c.sedes; },
      error: () => { this.sedes = []; }
    });
    this.ejecutar();
  }

  ejecutar(): void {
    this.cargando = true;
    this.error = false;
    this.modelosService.optimizarCupos(this.sede || null, this.cuposTotales).subscribe({
      next: (res) => {
        this.resultado = res;
        this.datosBarras = res.asignaciones.map(a => ({ label: a.facultad, value: a.cuposAsignados }));
        this.resumenKpi = {
          cuposAsignados: res.asignaciones.reduce((s, a) => s + (a.cuposAsignados || 0), 0),
          facultadesAtendidas: res.asignaciones.filter(a => (a.cuposAsignados || 0) > 0).length
        };
        this.conclusion = this.construirConclusion(res);
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = true; }
    });
  }

  private construirConclusion(res: ResultadoOptimizacion): any {
    const totalAsignado = res.asignaciones.reduce((s, a) => s + (a.cuposAsignados || 0), 0);
    const facultadesAtendidas = res.asignaciones.filter(a => (a.cuposAsignados || 0) > 0).length;
    const totalDemanda = res.asignaciones.reduce((s, a) => s + a.demandaHistoricaPromedio, 0);
    const masCupos = [...res.asignaciones].sort((a, b) => (b.cuposAsignados || 0) - (a.cuposAsignados || 0))[0];
    const menosCupos = [...res.asignaciones].filter(a => (a.cuposAsignados || 0) > 0).sort((a, b) => (a.cuposAsignados || 0) - (b.cuposAsignados || 0))[0];

    const sedeTxt = res.sede ? `en <strong>${res.sede}</strong>` : '<strong>todas las sedes</strong>';
    const cobertura = res.cuposTotales > 0 ? (totalAsignado / res.cuposTotales) * 100 : 0;
    const demandaCubierta = totalDemanda > 0 ? Math.min(cobertura, 100) : 0;

    const lead = `📊 <strong>Resultado:</strong> Con <strong>${res.cuposTotales}</strong> cupos disponibles, el modelo asignó <strong>${totalAsignado}</strong> cupos entre <strong>${facultadesAtendidas}</strong> facultades ${sedeTxt}. ` +
      `La facultad con mayor asignación recibió <strong>${masCupos?.cuposAsignados || 0}</strong> cupos (<strong>${masCupos?.facultad}</strong>), ` +
      `y la de menor fue <strong>${menosCupos?.facultad}</strong> con <strong>${menosCupos?.cuposAsignados || 0}</strong> cupos. ` +
      `El índice de equidad (valor objetivo) es <strong>${res.valorObjetivo.toFixed(4)}</strong>.`;

    const texto = `El modelo usó programación lineal (Simplex) para maximizar la equidad en la asignación, ` +
      `priorizando facultades con menor participación histórica. Las restricciones fueron: no exceder la demanda histórica de cada facultad ni el total de cupos disponibles. ` +
      `Se evaluaron <strong>${res.asignaciones.length}</strong> facultades con demandas promedio que van desde ` +
      `<strong>${Math.min(...res.asignaciones.map(a => a.demandaHistoricaPromedio)).toFixed(1)}</strong> hasta ` +
      `<strong>${Math.max(...res.asignaciones.map(a => a.demandaHistoricaPromedio)).toFixed(1)}</strong> estudiantes.` +
      (cobertura < 100 ? ` Se utilizó el <strong>${cobertura.toFixed(1)}%</strong> de los cupos disponibles porque la demanda total es menor que la oferta.` : '');

    const recomendaciones: string[] = [];
    if (cobertura < 80) {
      recomendaciones.push(`📉 Los cupos solicitados (${res.cuposTotales}) superan la demanda total de las facultades. Revisar si conviene redistribuir o abrir nuevas plazas.`);
    } else if (cobertura === 100) {
      recomendaciones.push(`✅ Todos los cupos fueron asignados. La demanda total coincide con la oferta disponible.`);
    }
    if (facultadesAtendidas < res.asignaciones.length) {
      recomendaciones.push(`⚠️ ${res.asignaciones.length - facultadesAtendidas} facultad(es) no recibió(ron) cupos nuevos porque su demanda histórica fue cero o no cumple la restricción de la función objetivo.`);
    }
    recomendaciones.push(`🎯 <strong>Uso del valor objetivo (${res.valorObjetivo.toFixed(4)})</strong>: valores cercanos a 1 indican alta equidad; valores bajos indican concentración en pocas facultades.`);
    recomendaciones.push(`🔄 <strong>Próximo paso:</strong> Validar con decanos si las asignaciones son viables operativamente antes de implementar.`);

    return { lead, texto, recomendaciones };
  }
}
