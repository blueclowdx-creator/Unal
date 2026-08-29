import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModelosService } from '../../core/services/modelos.service';
import { ResultadoClasificacion } from '../../core/models/models';

@Component({
  selector: 'app-modelo-clasificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <span class="course-code">MOD-02 · CLASIFICACIÓN</span>
    <h1>Probabilidad de ingreso por modalidad regional (PEAMA)</h1>
    <p class="note">
      Ajusta una regresión logística sobre datos agregados (frecuencias por estrato y tipo de
      colegio) para estimar la probabilidad de que un perfil de ingreso corresponda a la
      modalidad de admisión regional PEAMA. Objetivo: identificar brechas de acceso y apoyar
      políticas de equidad territorial.
    </p>

    <form class="model-form" (ngSubmit)="ejecutar()">
      <div class="field">
        <label>Estrato</label>
        <select [(ngModel)]="estrato" name="estrato">
          <option *ngFor="let e of estratos" [value]="e">{{ e }}</option>
        </select>
      </div>
      <div class="field">
        <label>Tipo de colegio</label>
        <select [(ngModel)]="tipoColegio" name="tipoColegio">
          <option value="Oficial">Oficial</option>
          <option value="Privado">Privado</option>
        </select>
      </div>
      <button class="btn" type="submit">Estimar probabilidad</button>
    </form>

    <div class="loading" *ngIf="cargando">Entrenando modelo…</div>
    <div class="error" *ngIf="error">No fue posible ejecutar el modelo. Verifica los microservicios.</div>

    <div class="grid grid-2" *ngIf="resultado && !cargando">
      <div class="card kpi">
        <span class="kpi__value">{{ (resultado.probabilidadEstimada * 100) | number:'1.1-1' }}%</span>
        <span class="kpi__label">Probabilidad estimada de ingreso PEAMA</span>
      </div>
      <div class="card">
        <h3>Coeficientes del modelo</h3>
        <table class="data-table">
          <tbody>
            <tr><td>Intercepto (b0)</td><td class="mono">{{ resultado.coeficientes.b0 | number:'1.4-4' }}</td></tr>
            <tr><td>Coef. estrato</td><td class="mono">{{ resultado.coeficientes.bEstrato | number:'1.4-4' }}</td></tr>
            <tr><td>Coef. colegio oficial</td><td class="mono">{{ resultado.coeficientes.bColegioOficial | number:'1.4-4' }}</td></tr>
            <tr><td>Grupos de entrenamiento</td><td class="mono">{{ resultado.muestrasEntrenamiento }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card conclusion" *ngIf="resultado && !cargando && conclusion">
      <h3>Conclusión del modelo</h3>
      <p [innerHTML]="conclusion.texto"></p>
      <ul>
        <li *ngFor="let r of conclusion.recomendaciones" [innerHTML]="r"></li>
      </ul>
    </div>
  `,
  styles: [`
    .conclusion { border-left: 4px solid var(--color-accent); }
    .conclusion p { margin: 0 0 10px 0; }
    .conclusion ul { margin: 8px 0; padding-left: 20px; }
    .conclusion li { margin: 4px 0; line-height: 1.5; }
  `]
})
export class ModeloClasificacionComponent {
  estratos = ['Estrato 1', 'Estrato 2', 'Estrato 3', 'Estrato 4', 'Estrato 5', 'Estrato 6'];
  estrato = 'Estrato 1';
  tipoColegio = 'Oficial';
  resultado?: ResultadoClasificacion;
  cargando = false;
  error = false;
  conclusion?: { texto: string; recomendaciones: string[] };

  constructor(private modelosService: ModelosService) {}

  ejecutar(): void {
    this.cargando = true;
    this.error = false;
    this.modelosService.equidadClasificacion(this.estrato, this.tipoColegio).subscribe({
      next: (res) => {
        this.resultado = res;
        this.conclusion = this.construirConclusion(res);
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = true; }
    });
  }

  private construirConclusion(res: ResultadoClasificacion): any {
    const p = res.probabilidadEstimada;
    const pPct = (p * 100).toFixed(1);
    const nivel = p > 0.6 ? 'alta' : p > 0.3 ? 'moderada' : p > 0.1 ? 'baja' : 'muy baja';
    const color = p > 0.6 ? 'con alta probabilidad' : p > 0.3 ? 'con probabilidad moderada' : 'con baja probabilidad';
    const estratoNum = this.estrato.replace(/\D/g, '');
    const sentidoEstrato = res.coeficientes.bEstrato < 0 ? 'menor' : 'mayor';
    const sentidoColegio = res.coeficientes.bColegioOficial > 0 ? 'positivo' : 'negativo';

    const texto = `Para un estudiante de <strong>${this.estrato}</strong> que proviene de colegio <strong>${this.tipoColegio}</strong>, ` +
      `la probabilidad estimada de ingreso por la modalidad <strong>PEAMA</strong> es del <strong>${pPct}%</strong> (probabilidad ${nivel}). ` +
      `El modelo se entrenó con <strong>${res.muestrasEntrenamiento} grupos</strong> de (estrato, tipo de colegio) observados históricamente. ` +
      `El coeficiente de estrato es <strong>${res.coeficientes.bEstrato.toFixed(4)}</strong>: a medida que el estrato socioeconómico aumenta, la probabilidad de PEAMA es <strong>${sentidoEstrato}</strong>. ` +
      `El coeficiente de colegio oficial es <strong>${res.coeficientes.bColegioOficial.toFixed(4)}</strong> (efecto <strong>${sentidoColegio}</strong> en la probabilidad).`;

    const recomendaciones: string[] = [];
    if (p > 0.5) {
      recomendaciones.push(`✅ El perfil <strong>${this.estrato} + ${this.tipoColegio}</strong> tiene alta probabilidad de acceder por PEAMA. Es coherente con la población objetivo del programa.`);
    } else if (p > 0.2) {
      recomendaciones.push(`🔶 Probabilidad moderada. Revisar si los canales de difusión de PEAMA están llegando adecuadamente a este perfil.`);
    } else {
      recomendaciones.push(`⚠️ Probabilidad baja. Este perfil estadísticamente no está accediendo por PEAMA. Considerar acciones afirmativas específicas.`);
    }
    if (this.tipoColegio === 'Privado' && p < 0.2) {
      recomendaciones.push(`🏫 Estudiantes de colegio privado tienen menor probabilidad de PEAMA, consistente con la orientación del programa a zonas de presencia regional.`);
    }
    recomendaciones.push(`📊 Esta estimación es un <strong>promedio histórico</strong>; la decisión de admisión real depende de cada convocatoria específica.`);

    return { texto, recomendaciones };
  }
}
