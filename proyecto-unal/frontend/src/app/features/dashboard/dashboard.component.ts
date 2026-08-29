import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatriculaService } from '../../core/services/matricula.service';
import { MatriculaPeriodoSede } from '../../core/models/models';
import { LineChartComponent, SerieLinea } from '../../shared/charts/line-chart.component';
import { DoughnutChartComponent, DatoDona } from '../../shared/charts/doughnut-chart.component';
import { MultiLineChartComponent, MultiLineInput, SerieMultiple } from '../../shared/charts/multi-line-chart.component';

interface StatsServicio {
  periodos: string[];
  porPeriodoTotal: { [periodo: string]: number };
  porSedePeriodo: { [sede: string]: { [periodo: string]: number } };
  porSexoTotal: { [sexo: string]: number };
  porEstratoTotal: { [estrato: string]: number };
  porSedeTotal: { [sede: string]: number };
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LineChartComponent, DoughnutChartComponent, MultiLineChartComponent],
  template: `
    <span class="course-code">PANEL GENERAL</span>
    <h1>Analítica de matrícula · Universidad Nacional</h1>
    <p class="note">
      Datos de matrícula 2019–2023 (137.283 registros). Este panel resume el comportamiento
      histórico; los 4 modelos matemáticos del menú lateral generan proyecciones y
      recomendaciones a partir de esta misma base.
    </p>

    <div class="grid grid-4" style="margin-top:20px;">
      <div class="card kpi">
        <span class="kpi__value">{{ stats?.total | number }}</span>
        <span class="kpi__label">Matrículas registradas</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ sedesUnicas }}</span>
        <span class="kpi__label">Sedes activas</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ facultadesUnicas }}</span>
        <span class="kpi__label">Facultades</span>
      </div>
      <div class="card kpi">
        <span class="kpi__value">{{ stats?.periodos?.length || 0 }}</span>
        <span class="kpi__label">Periodos académicos</span>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <div class="card-head">
        <h3>Serie histórica de matrícula total por periodo</h3>
      </div>
      <div class="loading" *ngIf="cargando">Cargando datos…</div>
      <app-line-chart *ngIf="!cargando && serieTotal.length > 0"
                      [historico]="serieTotal"
                      [proyeccion]="[]"
                      [showZoom]="false"
                      yLabel="Matriculados"></app-line-chart>
    </div>

    <div class="grid grid-2" style="margin-top:20px;">
      <div class="card">
        <h3>Distribución por sexo</h3>
        <app-doughnut-chart *ngIf="!cargando" [datos]="distSexo"></app-doughnut-chart>
      </div>
      <div class="card">
        <h3>Distribución por estrato</h3>
        <app-doughnut-chart *ngIf="!cargando" [datos]="distEstrato"></app-doughnut-chart>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <div class="card-head">
        <h3>Comparativa por sede</h3>
        <div class="filtros">
          <label>Tipo:</label>
          <select [(ngModel)]="topSedesTipo" (change)="rebuildMultiSede()">
            <option value="all">Todas las sedes</option>
            <option value="top5">Top 5 por matrículas</option>
            <option value="top3">Top 3 por matrículas</option>
          </select>
        </div>
      </div>
      <p class="hint" *ngIf="cargando">Cargando…</p>
      <app-multi-line-chart *ngIf="!cargando && multiSedeInput.series.length > 0"
                             [data]="multiSedeInput"></app-multi-line-chart>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Distribución por sede (total histórico)</h3>
      <app-doughnut-chart *ngIf="!cargando" [datos]="distSede"></app-doughnut-chart>
    </div>
  `,
  styles: [`
    .card-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .card-head h3 { margin: 0; }
    .filtros { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; color: var(--color-muted); }
    .filtros select { padding: 4px 8px; border: 1px solid var(--color-line); border-radius: 4px; background: #fff; font-size: 0.85rem; }
    .hint { font-size: 0.8rem; color: var(--color-muted); }
  `]
})
export class DashboardComponent implements OnInit {
  cargando = true;
  datos: MatriculaPeriodoSede[] = [];
  stats?: StatsServicio;
  serieTotal: SerieLinea[] = [];
  distSexo: DatoDona[] = [];
  distEstrato: DatoDona[] = [];
  distSede: DatoDona[] = [];
  multiSedeInput: MultiLineInput = { labels: [], series: [] };
  topSedesTipo: 'all' | 'top5' | 'top3' = 'top5';
  sedesUnicas = 0;
  facultadesUnicas = 0;

  constructor(private matriculaService: MatriculaService) {}

  ngOnInit(): void {
    this.matriculaService.statsPorPeriodoSede().subscribe({
      next: (data) => {
        this.datos = data;
        this.calcularEstadisticas();
        this.rebuildMultiSede();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private calcularEstadisticas(): void {
    const periodosSet = new Set<string>();
    const porPeriodoTotal: { [k: string]: number } = {};
    const porSedePeriodo: { [sede: string]: { [k: string]: number } } = {};
    const porSedeTotal: { [sede: string]: number } = {};
    const facultadesSet = new Set<string>();
    let total = 0;

    for (const d of this.datos) {
      const key = `${d.anio}-${d.semestre}`;
      periodosSet.add(key);
      porPeriodoTotal[key] = (porPeriodoTotal[key] || 0) + d.total;
      if (!porSedePeriodo[d.sede]) porSedePeriodo[d.sede] = {};
      porSedePeriodo[d.sede][key] = (porSedePeriodo[d.sede][key] || 0) + d.total;
      porSedeTotal[d.sede] = (porSedeTotal[d.sede] || 0) + d.total;
      facultadesSet.add(d.facultad);
      total += d.total;
    }

    const periodos = Array.from(periodosSet).sort();

    this.stats = {
      periodos,
      porPeriodoTotal,
      porSedePeriodo,
      porSedeTotal,
      porSexoTotal: {},
      porEstratoTotal: {},
      total,
    };

    this.sedesUnicas = Object.keys(porSedeTotal).length;
    this.facultadesUnicas = facultadesSet.size;

    this.serieTotal = periodos.map(p => ({ label: p, value: porPeriodoTotal[p] }));

    this.distSede = Object.entries(porSedeTotal)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

    // Cargar distribuciones adicionales en paralelo
    this.cargarDistribuciones();
  }

  private cargarDistribuciones(): void {
    // Sexo: agregamos desde el endpoint de perfiles
    this.matriculaService.listar({ page: 0, size: 20000 }).subscribe({
      next: (page) => {
        const porSexo: { [k: string]: number } = {};
        const porEstrato: { [k: string]: number } = {};
        for (const r of page.content) {
          const s = (r.sexo || 'Sin información').trim();
          porSexo[s] = (porSexo[s] || 0) + 1;
          const e = (r.estrato || 'Sin información').trim();
          porEstrato[e] = (porEstrato[e] || 0) + 1;
        }
        this.distSexo = Object.entries(porSexo)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({ label, value }));
        this.distEstrato = Object.entries(porEstrato)
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({ label, value }));
      },
    });
  }

  rebuildMultiSede(): void {
    if (!this.stats) return;
    const labels = this.stats.periodos;
    const todasSedes = Object.keys(this.stats.porSedePeriodo);

    let sedes: string[];
    if (this.topSedesTipo === 'all') {
      sedes = todasSedes;
    } else {
      const n = this.topSedesTipo === 'top3' ? 3 : 5;
      sedes = Object.entries(this.stats.porSedeTotal)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([s]) => s);
    }

    const series: SerieMultiple[] = sedes.map(sede => ({
      nombre: sede,
      valores: labels.map(l => this.stats!.porSedePeriodo[sede]?.[l] || 0),
    }));

    this.multiSedeInput = { labels, series, yLabel: 'Matriculados' };
  }
}
