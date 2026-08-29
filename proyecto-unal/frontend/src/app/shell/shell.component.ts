import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { UsuarioActual } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar__brand">UNAL · Analítica</div>
        <div class="sidebar__subbrand">Matrícula 2019–2023</div>

        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Panel general</a>
          <a routerLink="/matriculas" routerLinkActive="active">Registros de matrícula</a>
        </nav>

        <div class="section-label">Modelos matemáticos</div>
        <nav>
          <a routerLink="/modelos/regresion" routerLinkActive="active">
            <span class="course-code" style="margin:0">MOD-01</span>&nbsp;Regresión · Demanda
          </a>
          <a routerLink="/modelos/clasificacion" routerLinkActive="active">
            <span class="course-code" style="margin:0">MOD-02</span>&nbsp;Clasificación · Equidad
          </a>
          <a routerLink="/modelos/optimizacion" routerLinkActive="active">
            <span class="course-code" style="margin:0">MOD-03</span>&nbsp;Optimización · Cupos
          </a>
          <a routerLink="/modelos/clustering" routerLinkActive="active">
            <span class="course-code" style="margin:0">MOD-04</span>&nbsp;Clustering + MC
          </a>
        </nav>

        <div class="sidebar__user" *ngIf="user">
          <div class="user-info">
            <div class="user-name">{{ user.nombreCompleto || user.username }}</div>
            <div class="user-rol">{{ user.rol }}</div>
          </div>
          <button class="btn-logout" (click)="logout()" title="Cerrar sesión">Salir</button>
        </div>
      </aside>

      <main class="main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .sidebar__user {
      margin-top: auto;
      padding: 14px 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    .user-info { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 0.85rem; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-rol { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.06em; }
    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-family: var(--font-mono);
      cursor: pointer;
    }
    .btn-logout:hover { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
  `]
})
export class ShellComponent implements OnInit {
  user: UsuarioActual | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
