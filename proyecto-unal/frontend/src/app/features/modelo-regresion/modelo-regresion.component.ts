import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelosService } from '../../core/services/modelos.service';
import { MatriculaService } from '../../core/services/matricula.service';
import { ResultadoRegresion } from '../../core/models/models';
import { LineChartComponent, SerieLinea } from '../../shared/charts/line-chart.component';

@Component({
  selector: 'app-modelo-regresion',
  standalone: true,
  imports: [CommonModule, FormsModule, LineChartComponent],
  template: `
    <span class="course-code">MOD-01 · REGRESIÓN</span>
    <h1>Proyección de demanda de matrícula</h1>
    <p class="note">
      Ajusta una regresión lineal simple (mínimos cuadrados) sobre la serie histórica de
      matriculados por periodo académico y extrapola los periodos futuros solicitados.
      Objetivo: apoyar la planeación de capacidad instalada (aulas, docentes, cupos).
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
        <label>Periodos futuros</label>
        <input type="number" [(ngModel)]="periodosFuturos" name="periodosFuturos" min="1" max="12" />
      </div>
      <button class="btn" type="submit">Calcular proyección</button>
    </form>

    <div class="loading" *ngIf="cargando">Calculando modelo…</div>
    <div class="error" *ngIf="error">No fue posible ejecutar el modelo. Verifica que modelos-service y matricula-service estén disponibles.</div>

    <div class="grid grid-3" *ngIf="resultado && !cargando">
      <div class="card kpi">
        <span class="kpi__value">{{ (resumenKpi.estimadoFinal | number:'1.0-0') }}</span>
        <span class="kpi__label">Estudiantes estimados en el último periodo proyectado</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ (resumenKpi.totalHistorico | number:'1.0-0') }}</span>
        <span class="kpi__label">Total histórico (suma de {{ resultado.historico.length }} periodos)</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ (resumenKpi.totalProyectado | number:'1.0-0') }}</span>
        <span class="kpi__label">Total proyectado (suma de {{ resultado.proyeccion.length }} periodos)</span>
      </div>
    </div>

    <div class="grid grid-3" *ngIf="resultado && !cargando">
      <div class="card kpi">
        <span class="kpi__value">{{ resultado.pendiente | number:'1.1-1' }}</span>
        <span class="kpi__label">Pendiente (Δ estudiantes / periodo)</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ resultado.intercepto | number:'1.0-0' }}</span>
        <span class="kpi__label">Intercepto</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ resultado.r2 | number:'1.2-2' }}</span>
        <span class="kpi__label">R² (bondad de ajuste)</span>
      </div>
    </div>

    <div class="card" *ngIf="resultado && !cargando && serieHist.length > 0">
      <h3>Histórico y proyección{{ resultado.sedeFiltrada ? ' — ' + resultado.sedeFiltrada : ' (todas las sedes)' }}</h3>
      <app-line-chart [historico]="serieHist" [proyeccion]="serieProy"></app-line-chart>
    </div>

    <div class="card conclusion" *ngIf="resultado && !cargando && conclusion">
      <h3>Resultado y conclusión</h3>
      <div [class.alert-text]="conclusion.tieneAlerta">
        <p class="lead" [innerHTML]="conclusion.lead"></p>
        <p [innerHTML]="conclusion.texto"></p>
        <ul>
          <li *ngFor="let r of conclusion.recomendaciones" [innerHTML]="r"></li>
        </ul>
        <p *ngIf="conclusion.tieneAlerta" class="alerta">
          ⚠️ <strong>Atención:</strong> {{ conclusion.alerta }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .conclusion { border-left: 4px solid var(--color-accent); }
    .conclusion p { margin: 0 0 10px 0; }
    .conclusion .lead { font-size: 1.05rem; line-height: 1.5; }
    .conclusion ul { margin: 8px 0; padding-left: 20px; }
    .conclusion li { margin: 4px 0; line-height: 1.5; }
    .conclusion .alerta { color: var(--color-alert); margin-top: 10px; }
    .alert-text .lead { color: var(--color-alert); }
  `]
})
export class ModeloRegresionComponent implements OnInit {
  sede = '';
  periodosFuturos = 4;
  resultado?: ResultadoRegresion;
  serieHist: SerieLinea[] = [];
  serieProy: SerieLinea[] = [];
  resumenKpi = { estimadoFinal: 0, totalHistorico: 0, totalProyectado: 0 };
  cargando = false;
  error = false;
  sedes: string[] = [];
  conclusion?: {
    lead: string;
    texto: string;
    recomendaciones: string[];
    tieneAlerta: boolean;
    alerta: string;
  };

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
    this.modelosService.proyeccionRegresion(this.sede || null, this.periodosFuturos).subscribe({
      next: (res) => {
        this.resultado = res;
        this.serieHist = res.historico.map(p => ({ label: `${p.anio}-${p.semestre}`, value: p.total }));
        this.serieProy = res.proyeccion.map(p => ({ label: `${p.anio}-${p.semestre}`, value: p.total }));
        const totalHistorico = res.historico.reduce((s, p) => s + p.total, 0);
        const totalProyectado = res.proyeccion.reduce((s, p) => s + Math.max(0, p.total), 0);
        this.resumenKpi = {
          estimadoFinal: Math.max(0, res.proyeccion[res.proyeccion.length - 1]?.total || 0),
          totalHistorico,
          totalProyectado
        };
        this.conclusion = this.construirConclusion(res);
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = true; }
    });
  }

  private construirConclusion(res: ResultadoRegresion): any {
    const totalHistorico = res.historico.reduce((s, p) => s + p.total, 0);
    const promedioHistorico = res.historico.length > 0 ? totalHistorico / res.historico.length : 0;
    const ultimaReal = res.historico[res.historico.length - 1];
    const primeraProy = res.proyeccion[0];
    const ultimaProy = res.proyeccion[res.proyeccion.length - 1];
    const totalProyectado = res.proyeccion.reduce((s, p) => s + p.total, 0);
    const tieneAlerta = res.proyeccion.some(p => p.total < 0) || (typeof res.r2 === 'number' && res.r2 < 0.5);

    const sedeTxt = res.sedeFiltrada ? `la sede <strong>${res.sedeFiltrada}</strong>` : '<strong>todas las sedes</strong>';
    const r2 = typeof res.r2 === 'number' ? res.r2 : 0;
    const r2Calidad = r2 > 0.8 ? 'excelente' : r2 > 0.6 ? 'aceptable' : r2 > 0.4 ? 'débil' : 'muy débil';
    const pendiente = typeof res.pendiente === 'number' ? res.pendiente : 0;
    const tendencia = pendiente > 50 ? 'creciente' : pendiente < -50 ? 'decreciente' : 'estable';
    const variacion = ultimaReal && primeraProy ? primeraProy.total - ultimaReal.total : 0;
    const variacionPct = ultimaReal && primeraProy && ultimaReal.total > 0 ? (variacion / ultimaReal.total) * 100 : 0;
    const estimadoFinalNum = Math.max(0, ultimaProy?.total || 0);
    const totalProy = Math.max(0, totalProyectado);

    const lead = `📊 <strong>Resultado:</strong> El modelo estima que en el periodo <strong>${ultimaProy?.anio}-${ultimaProy?.semestre}</strong> se matricularán aproximadamente <strong>${estimadoFinalNum.toLocaleString('es-CO')}</strong> estudiantes en ${sedeTxt} ` +
      `(saliendo de <strong>${ultimaReal?.total.toLocaleString('es-CO')}</strong> en ${ultimaReal?.anio}-${ultimaReal?.semestre}). ` +
      `En total, durante los próximos <strong>${res.proyeccion.length} periodos</strong> se esperan <strong>${totalProy.toLocaleString('es-CO')}</strong> matrículas.`;

    const texto = `Se ajustó una regresión lineal sobre <strong>${res.historico.length} periodos históricos</strong> de ${sedeTxt}, ` +
      `con un total histórico de <strong>${totalHistorico.toLocaleString('es-CO')}</strong> matrículas y un promedio de <strong>${Math.round(promedioHistorico).toLocaleString('es-CO')}</strong> por periodo. ` +
      `La bondad de ajuste (R²) es <strong>${r2.toFixed(2)}</strong> (${r2Calidad}), lo que indica que la tendencia explica el ${(r2 * 100).toFixed(0)}% de la variabilidad observada. ` +
      `La pendiente es <strong>${pendiente.toFixed(1)}</strong> estudiantes por periodo, reflejando una tendencia <strong>${tendencia}</strong> ` +
      `(variación estimada entre el último periodo real y el primero proyectado: ${variacionPct > 0 ? '+' : ''}${variacionPct.toFixed(1)}%).`;

    const recomendaciones: string[] = [];
    if (tendencia === 'creciente' && r2 > 0.6) {
      recomendaciones.push(`📈 <strong>Planear ampliación de capacidad</strong> en ${sedeTxt}: aulas, docentes y cupos deben crecer al ritmo de ~${Math.abs(pendiente).toFixed(0)} estudiantes por periodo.`);
    } else if (tendencia === 'decreciente' && r2 > 0.6) {
      recomendaciones.push(`📉 <strong>Revisar oferta académica</strong> en ${sedeTxt}: la demanda cae ~${Math.abs(pendiente).toFixed(0)} estudiantes por periodo; conviene reasignar recursos a otras sedes.`);
    } else if (r2 < 0.5) {
      recomendaciones.push(`⚠️ <strong>Modelo poco confiable</strong>: la serie histórica tiene muy poca variabilidad explicable. Recomendar complementar con variables externas (PAES, PEAMA, políticas).`);
    } else {
      recomendaciones.push(`➡️ <strong>Demanda estable</strong> alrededor de ${Math.round(promedioHistorico).toLocaleString('es-CO')} matrículas por periodo. Mantener la capacidad actual.`);
    }
    recomendaciones.push(`🎯 <strong>Próximo periodo proyectado</strong> (${primeraProy?.anio}-${primeraProy?.semestre}): ${Math.max(0, primeraProy?.total || 0).toLocaleString('es-CO')} estudiantes.`);
    recomendaciones.push(`🔍 <strong>Validar</strong> con datos reales al cierre del siguiente periodo y re-entrenar si la diferencia supera el 15%.`);

    let alerta = '';
    if (res.proyeccion.some(p => p.total < 0)) {
      alerta = 'La regresión proyecta valores negativos en algunos periodos futuros. Esto indica que la tendencia lineal histórica no es sostenible; el modelo debe interpretarse solo como tendencia direccional, no como predicción puntual.';
    } else if (r2 < 0.5) {
      alerta = 'El R² es bajo: la serie tiene alta variabilidad no explicada por la tendencia lineal. Use esta proyección solo como referencia direccional.';
    }

    return { lead, texto, recomendaciones, tieneAlerta, alerta };
  }
}
