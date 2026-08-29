import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelosService } from '../../core/services/modelos.service';
import { ResultadoClustering, ResultadoSimulacion } from '../../core/models/models';

@Component({
  selector: 'app-modelo-clustering',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <span class="course-code">MOD-04 · CLUSTERING + MONTE CARLO</span>
    <h1>Segmentación de perfiles y simulación de escenarios</h1>
    <p class="note">
      (a) K-Means agrupa perfiles de estudiantes por edad, estrato, PBM y tipo de colegio, útil
      para diseñar políticas de bienestar diferenciadas. (b) La simulación de Monte Carlo usa la
      tasa de crecimiento histórica (media y desviación) para proyectar percentiles P10/P50/P90
      de matrícula futura.
    </p>

    <div class="card">
      <h3>Segmentación (K-Means)</h3>
      <form class="model-form" (ngSubmit)="ejecutarClustering()">
        <div class="field">
          <label>Número de clusters (k)</label>
          <input type="number" [(ngModel)]="k" name="k" min="2" max="8" />
        </div>
        <div class="field">
          <label>Muestra (registros)</label>
          <input type="number" [(ngModel)]="muestra" name="muestra" min="500" max="20000" step="500" />
        </div>
        <button class="btn" type="submit">Segmentar</button>
      </form>

      <div class="loading" *ngIf="cargandoCluster">Ejecutando K-Means…</div>
      <div class="grid grid-3" *ngIf="clustering && !cargandoCluster">
        <div class="card kpi">
          <span class="kpi__value">{{ clustering.muestrasUsadas }}</span>
          <span class="kpi__label">Registros segmentados</span>
        </div>
        <div class="card kpi">
          <span class="kpi__value">{{ clustering.clusters.length }}</span>
          <span class="kpi__label">Clusters generados (k)</span>
        </div>
        <div class="card kpi">
          <span class="kpi__value">{{ clustering.clusters[0]?.tamano || 0 }}</span>
          <span class="kpi__label">Tamaño del cluster más grande</span>
        </div>
      </div>

      <table class="data-table" *ngIf="clustering && !cargandoCluster">
        <thead><tr><th>Cluster</th><th>Tamaño</th><th>% muestra</th><th>Edad prom.</th><th>Estrato prom.</th><th>PBM prom.</th><th>% colegio oficial</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of clustering.clusters">
            <td class="mono">C{{ c.id }}</td>
            <td class="mono">{{ c.tamano }}</td>
            <td class="mono">{{ (c.tamano / clustering.muestrasUsadas * 100) | number:'1.1-1' }}%</td>
            <td class="mono">{{ c.edadPromedio | number:'1.1-1' }}</td>
            <td class="mono">{{ c.estratoPromedio | number:'1.1-1' }}</td>
            <td class="mono">{{ c.pbmPromedio | number:'1.1-1' }}</td>
            <td class="mono">{{ (c.proporcionOficial * 100) | number:'1.0-0' }}%</td>
          </tr>
        </tbody>
      </table>

      <div class="card conclusion" *ngIf="clustering && !cargandoCluster && conclusionCluster">
        <h3>Resultado y conclusión (Segmentación)</h3>
        <p class="lead" [innerHTML]="conclusionCluster.lead"></p>
        <p [innerHTML]="conclusionCluster.texto"></p>
        <ul>
          <li *ngFor="let r of conclusionCluster.recomendaciones" [innerHTML]="r"></li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3>Simulación de Monte Carlo</h3>
      <form class="model-form" (ngSubmit)="ejecutarSimulacion()">
        <div class="field">
          <label>Periodos futuros</label>
          <input type="number" [(ngModel)]="periodosFuturos" name="periodosFuturos" min="1" max="20" />
        </div>
        <div class="field">
          <label>Iteraciones</label>
          <input type="number" [(ngModel)]="iteraciones" name="iteraciones" min="500" max="20000" step="500" />
        </div>
        <button class="btn" type="submit">Simular</button>
      </form>

      <div class="loading" *ngIf="cargandoSim">Ejecutando simulación…</div>
      <div *ngIf="simulacion && !cargandoSim">
        <div class="grid grid-3">
          <div class="card kpi">
            <span class="kpi__value">{{ simulacion.matriculaBase | number:'1.0-0' }}</span>
            <span class="kpi__label">Matrícula base (último periodo real)</span>
          </div>
          <div class="card kpi">
            <span class="kpi__value">{{ (simulacion.tasaCrecimientoMedia*100) | number:'1.2-2' }}%</span>
            <span class="kpi__label">Crecimiento medio (± {{ (simulacion.tasaCrecimientoDesv*100) | number:'1.2-2' }}%)</span>
          </div>
          <div class="card kpi">
          <span class="kpi__value">{{ (simulacion.escenarios[simulacion.escenarios.length-1]?.p50 || 0) | number:'1.0-0' }}</span>
          <span class="kpi__label">Estimación esperada en +{{ simulacion.escenarios[simulacion.escenarios.length-1]?.indicePeriodo || 0 }} periodos</span>
          </div>
        </div>
        <p class="mono" style="font-size:0.8rem; color:var(--color-muted);">
          Tasa de crecimiento histórica: media {{ (simulacion.tasaCrecimientoMedia*100) | number:'1.2-2' }}% ·
          desviación {{ (simulacion.tasaCrecimientoDesv*100) | number:'1.2-2' }}% ·
          base: {{ simulacion.matriculaBase | number }} estudiantes
        </p>
        <table class="data-table">
          <thead><tr><th>Periodo futuro</th><th>P10 (pesimista)</th><th>P50 (esperado)</th><th>P90 (optimista)</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of simulacion.escenarios">
              <td class="mono">+{{ e.indicePeriodo }}</td>
              <td class="mono">{{ e.p10 | number:'1.0-0' }}</td>
              <td class="mono">{{ e.p50 | number:'1.0-0' }}</td>
              <td class="mono">{{ e.p90 | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card conclusion" *ngIf="simulacion && !cargandoSim && conclusionSim">
        <h3>Resultado y conclusión (Monte Carlo)</h3>
        <p class="lead" [innerHTML]="conclusionSim.lead"></p>
        <p [innerHTML]="conclusionSim.texto"></p>
        <ul>
          <li *ngFor="let r of conclusionSim.recomendaciones" [innerHTML]="r"></li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .conclusion { border-left: 4px solid var(--color-accent); margin-top: 16px; }
    .conclusion p { margin: 0 0 10px 0; }
    .conclusion .lead { font-size: 1.05rem; line-height: 1.5; }
    .conclusion ul { margin: 8px 0; padding-left: 20px; }
    .conclusion li { margin: 4px 0; line-height: 1.5; }
  `]
})
export class ModeloClusteringComponent implements OnInit {
  k = 4;
  muestra = 3000;
  clustering?: ResultadoClustering;
  cargandoCluster = false;
  conclusionCluster?: { lead: string; texto: string; recomendaciones: string[] };

  periodosFuturos = 8;
  iteraciones = 3000;
  simulacion?: ResultadoSimulacion;
  cargandoSim = false;
  conclusionSim?: { lead: string; texto: string; recomendaciones: string[] };

  constructor(private modelosService: ModelosService) {}

  ngOnInit(): void {
    this.ejecutarClustering();
    this.ejecutarSimulacion();
  }

  ejecutarClustering(): void {
    this.cargandoCluster = true;
    this.modelosService.clustering(this.k, this.muestra).subscribe({
      next: (res) => {
        this.clustering = res;
        this.conclusionCluster = this.construirConclusionCluster(res);
        this.cargandoCluster = false;
      },
      error: () => { this.cargandoCluster = false; }
    });
  }

  ejecutarSimulacion(): void {
    this.cargandoSim = true;
    this.modelosService.monteCarlo(this.periodosFuturos, this.iteraciones).subscribe({
      next: (res) => {
        this.simulacion = res;
        this.conclusionSim = this.construirConclusionSim(res);
        this.cargandoSim = false;
      },
      error: () => { this.cargandoSim = false; }
    });
  }

  private construirConclusionCluster(res: ResultadoClustering): any {
    const total = res.muestrasUsadas;
    const clusters = res.clusters;
    const masGrande = [...clusters].sort((a, b) => b.tamano - a.tamano)[0];
    const masPequeno = [...clusters].sort((a, b) => a.tamano - b.tamano)[0];
    const masOficial = [...clusters].sort((a, b) => b.proporcionOficial - a.proporcionOficial)[0];
    const masBajoEstrato = [...clusters].sort((a, b) => a.estratoPromedio - b.estratoPromedio)[0];

    const lead = `📊 <strong>Resultado:</strong> Con <strong>k=${res.clusters.length}</strong> clusters y <strong>${total.toLocaleString('es-CO')}</strong> registros, el segmento mayor (<strong>C${masGrande.id}</strong>) agrupa <strong>${masGrande.tamano}</strong> estudiantes (<strong>${(masGrande.tamano / total * 100).toFixed(1)}%</strong> de la muestra). ` +
      `El segmento menor (<strong>C${masPequeno.id}</strong>) tiene <strong>${masPequeno.tamano}</strong> estudiantes (<strong>${(masPequeno.tamano / total * 100).toFixed(1)}%</strong>).`;

    const texto = `K-Means agrupó los perfiles considerando edad, estrato, PBM y tipo de colegio. ` +
      `El cluster con mayor proporción de colegio oficial es <strong>C${masOficial.id}</strong> (<strong>${(masOficial.proporcionOficial * 100).toFixed(0)}%</strong> oficial). ` +
      `El cluster con menor estrato promedio es <strong>C${masBajoEstrato.id}</strong> (estrato ${masBajoEstrato.estratoPromedio.toFixed(1)}).`;

    const recomendaciones: string[] = [];
    recomendaciones.push(`🎯 <strong>Cluster mayoritario (C${masGrande.id})</strong>: ${masGrande.tamano} estudiantes con edad prom. ${masGrande.edadPromedio.toFixed(1)}, estrato ${masGrande.estratoPromedio.toFixed(1)}, PBM ${masGrande.pbmPromedio.toFixed(1)}. Es el perfil "típico" y debe concentrar los servicios de bienestar estándar.`);
    if (masOficial.id !== masGrande.id) {
      recomendaciones.push(`🏫 <strong>Cluster C${masOficial.id}</strong> (${(masOficial.proporcionOficial * 100).toFixed(0)}% oficial) representa <strong>${masOficial.tamano}</strong> estudiantes, principalmente de colegio público. Diseñar programas de apoyo (becas, tutorías) dirigidos a este segmento.`);
    }
    if (masBajoEstrato.id !== masGrande.id) {
      recomendaciones.push(`💰 <strong>Cluster C${masBajoEstrato.id}</strong> con estrato promedio ${masBajoEstrato.estratoPromedio.toFixed(1)} agrupa <strong>${masBajoEstrato.tamano}</strong> estudiantes. Es el segmento de mayor vulnerabilidad económica; focalizar allí los auxilios socioeconómicos.`);
    }
    recomendaciones.push(`🔄 Si la inercia es alta con el k actual, probar k distinto o más variables para lograr segmentos más compactos.`);

    return { lead, texto, recomendaciones };
  }

  private construirConclusionSim(res: ResultadoSimulacion): any {
    const ultimo = res.escenarios[res.escenarios.length - 1];
    const variacionP50 = ultimo && res.matriculaBase > 0 ? ((ultimo.p50 - res.matriculaBase) / res.matriculaBase) * 100 : 0;
    const variacionP10 = ultimo && res.matriculaBase > 0 ? ((ultimo.p10 - res.matriculaBase) / res.matriculaBase) * 100 : 0;
    const variacionP90 = ultimo && res.matriculaBase > 0 ? ((ultimo.p90 - res.matriculaBase) / res.matriculaBase) * 100 : 0;
    const rango = ultimo ? ultimo.p90 - ultimo.p10 : 0;

    const lead = `📊 <strong>Resultado:</strong> Partiendo de <strong>${res.matriculaBase.toLocaleString('es-CO')}</strong> estudiantes y una tasa de crecimiento media del <strong>${(res.tasaCrecimientoMedia * 100).toFixed(2)}%</strong> (±<strong>${(res.tasaCrecimientoDesv * 100).toFixed(2)}%</strong>), ` +
      `tras <strong>+${ultimo?.indicePeriodo}</strong> periodos la matrícula esperada (P50) sería de <strong>${ultimo?.p50.toLocaleString('es-CO')}</strong> estudiantes, ` +
      `con un escenario pesimista (P10) de <strong>${ultimo?.p10.toLocaleString('es-CO')}</strong> y optimista (P90) de <strong>${ultimo?.p90.toLocaleString('es-CO')}</strong>.`;

    const texto = `La simulación de Monte Carlo ejecutó <strong>${this.iteraciones.toLocaleString('es-CO')}</strong> iteraciones usando la distribución empírica de la tasa de crecimiento histórica. ` +
      `Los percentiles representan: <strong>P10</strong> escenario pesimista (10% de probabilidad de estar por debajo), <strong>P50</strong> esperado (mediana), <strong>P90</strong> optimista (10% de probabilidad de estar por encima). ` +
      `En el horizonte final, la variación esperada es <strong>${variacionP50 > 0 ? '+' : ''}${variacionP50.toFixed(1)}%</strong> (P50), con un rango de incertidumbre de <strong>${rango.toLocaleString('es-CO')}</strong> estudiantes entre P10 y P90.`;

    const recomendaciones: string[] = [];
    if (variacionP50 > 5) {
      recomendaciones.push(`📈 <strong>Tendencia al crecimiento</strong>: planificar capacidad para absorber un aumento de ~${Math.abs(variacionP50).toFixed(0)}% (de ${res.matriculaBase.toLocaleString('es-CO')} a ${ultimo?.p50.toLocaleString('es-CO')} estudiantes).`);
    } else if (variacionP50 < -5) {
      recomendaciones.push(`📉 <strong>Tendencia a la baja</strong>: considerar reasignación de recursos; la demanda caería ~${Math.abs(variacionP50).toFixed(0)}% en el horizonte simulado.`);
    } else {
      recomendaciones.push(`➡️ <strong>Demanda estable</strong> en el horizonte proyectado. Mantener la capacidad actual y revisar anualmente.`);
    }
    if (rango / res.matriculaBase > 0.3) {
      recomendaciones.push(`⚠️ <strong>Alta incertidumbre</strong>: el rango P10–P90 supera el 30% de la base. Recomendable combinar esta proyección con análisis cualitativos.`);
    } else {
      recomendaciones.push(`✅ Incertidumbre moderada: el rango P10–P90 es del <strong>${(rango / res.matriculaBase * 100).toFixed(0)}%</strong> de la base, dentro de márgenes manejables.`);
    }
    recomendaciones.push(`🎯 <strong>Planificación de capacidad</strong>: usar P90 para dimensionar el escenario optimista y P10 para verificar la sostenibilidad del escenario pesimista.`);
    recomendaciones.push(`🔍 <strong>Validar</strong> con datos reales al cierre de cada periodo y recalibrar la media y desviación usadas en la simulación.`);

    return { lead, texto, recomendaciones };
  }
}
