import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatriculaService, Catalogos } from '../../core/services/matricula.service';
import { MatriculaDetalle } from '../../core/models/models';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <span class="course-code">REGISTROS</span>
    <h1>Registros de matrícula</h1>

    <form class="model-form" (ngSubmit)="buscar()">
      <div class="field">
        <label>Año</label>
        <select [(ngModel)]="filtros.anio" name="anio" (change)="buscar()">
          <option [ngValue]="undefined">Todos</option>
          <option *ngFor="let a of catalogos.anios" [ngValue]="a">{{ a }}</option>
        </select>
      </div>
      <div class="field">
        <label>Semestre</label>
        <select [(ngModel)]="filtros.semestre" name="semestre" (change)="buscar()">
          <option [ngValue]="undefined">Todos</option>
          <option *ngFor="let s of catalogos.semestres" [ngValue]="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>Sede</label>
        <select [(ngModel)]="filtros.sede" name="sede" (change)="buscar()">
          <option [ngValue]="undefined">Todas</option>
          <option *ngFor="let s of catalogos.sedes" [value]="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>Facultad</label>
        <select [(ngModel)]="filtros.facultad" name="facultad" (change)="buscar()">
          <option [ngValue]="undefined">Todas</option>
          <option *ngFor="let f of catalogos.facultades" [value]="f">{{ f }}</option>
        </select>
      </div>
      <div class="field">
        <label>Sexo</label>
        <select [(ngModel)]="filtros.sexo" name="sexo" (change)="buscar()">
          <option [ngValue]="undefined">Todos</option>
          <option *ngFor="let s of catalogos.sexos" [value]="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>Estrato</label>
        <select [(ngModel)]="filtros.estrato" name="estrato" (change)="buscar()">
          <option [ngValue]="undefined">Todos</option>
          <option *ngFor="let e of catalogos.estratos" [value]="e">{{ e }}</option>
        </select>
      </div>
      <div class="field" style="align-self:flex-end;">
        <button class="btn" type="submit">Filtrar</button>
      </div>
    </form>

    <div class="card">
      <div class="loading" *ngIf="cargando">Cargando registros…</div>
      <div class="error" *ngIf="error">No fue posible cargar los datos. Verifica que matricula-service esté disponible.</div>

      <table class="data-table" *ngIf="!cargando && !error">
        <thead>
          <tr>
            <th>Periodo</th><th>Sede</th><th>Facultad</th><th>Programa</th>
            <th>Edad</th><th>Sexo</th><th>Estrato</th><th>Nuevo</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of registros">
            <td class="mono">{{ m.anio }}-{{ m.semestre }}</td>
            <td>{{ m.nombreSede }}</td>
            <td>{{ m.nombreFacultad }}</td>
            <td>{{ m.nombrePrograma }}</td>
            <td>{{ m.edad }}</td>
            <td>{{ m.sexo }}</td>
            <td>{{ m.estrato }}</td>
            <td><span class="badge" *ngIf="m.matriculadoPvez">Sí</span></td>
          </tr>
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;" *ngIf="!cargando && !error">
        <span class="mono" style="font-size:0.8rem; color:var(--color-muted);">
          Página {{ page + 1 }} de {{ totalPages || 1 }} · {{ totalElements | number }} registros
        </span>
        <div style="display:flex; gap:8px;">
          <button class="btn" [disabled]="page === 0" (click)="cambiarPagina(page - 1)">Anterior</button>
          <button class="btn" [disabled]="page + 1 >= totalPages" (click)="cambiarPagina(page + 1)">Siguiente</button>
        </div>
      </div>
    </div>
  `
})
export class MatriculasComponent implements OnInit {
  filtros: { anio?: number; semestre?: number; sede?: string; facultad?: string; sexo?: string; estrato?: string } = {};
  registros: MatriculaDetalle[] = [];
  page = 0;
  size = 15;
  totalPages = 0;
  totalElements = 0;
  cargando = true;
  error = false;
  catalogos: Catalogos = { anios: [], semestres: [], sedes: [], facultades: [], sexos: [], estratos: [], tiposColegio: [], programas: [] };

  constructor(private matriculaService: MatriculaService) {}

  ngOnInit(): void {
    this.matriculaService.catalogos().subscribe({
      next: (c) => { this.catalogos = c; this.buscar(); },
      error: () => { this.catalogos = { anios: [], semestres: [], sedes: [], facultades: [], sexos: [], estratos: [], tiposColegio: [], programas: [] }; this.buscar(); }
    });
  }

  buscar(): void {
    this.page = 0;
    this.cargar();
  }

  cambiarPagina(nueva: number): void {
    this.page = nueva;
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.error = false;
    this.matriculaService.listar({ ...this.filtros, page: this.page, size: this.size }).subscribe({
      next: (res) => {
        this.registros = res.content;
        this.totalPages = res.totalPages;
        this.totalElements = res.totalElements;
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = true; }
    });
  }
}
