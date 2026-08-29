import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <div class="brand">
          <span class="brand-title">UNAL · Analítica</span>
          <span class="brand-sub">Acceso seguro al panel de matrícula 2019–2023</span>
        </div>

        <h1>Iniciar sesión</h1>
        <p class="note">Ingresa con tu usuario institucional para continuar.</p>

        <form (ngSubmit)="login()" *ngIf="!cargando">
          <div class="field">
            <label>Usuario</label>
            <input type="text" name="username" [(ngModel)]="username" autocomplete="username" required autofocus />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required />
          </div>
          <button class="btn" type="submit" [disabled]="!username || !password">Entrar</button>
        </form>

        <div class="loading" *ngIf="cargando">Validando credenciales…</div>
        <div class="error" *ngIf="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-d) 100%);
      padding: 20px;
    }
    .login-card {
      background: var(--color-surface);
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      max-width: 420px;
      width: 100%;
    }
    .brand { display: flex; flex-direction: column; margin-bottom: 18px; }
    .brand-title { font-family: var(--font-display); font-size: 1.4rem; color: var(--color-primary-d); font-weight: 600; }
    .brand-sub { font-family: var(--font-mono); font-size: 0.68rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    h1 { font-size: 1.5rem; margin-bottom: 6px; }
    .note { font-size: 0.85rem; color: var(--color-muted); margin-bottom: 22px; }
    form { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.78rem; color: var(--color-muted); font-family: var(--font-mono); }
    .field input {
      padding: 11px 12px;
      border: 1px solid var(--color-line);
      border-radius: 6px;
      font-size: 0.95rem;
      background: #fff;
      color: var(--color-ink);
    }
    .field input:focus { outline: 2px solid var(--color-accent); border-color: transparent; }
    .btn { margin-top: 8px; }
    .error { color: var(--color-alert); font-family: var(--font-mono); font-size: 0.85rem; margin-top: 12px; }
    .loading { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.85rem; margin-top: 12px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  cargando = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  login() {
    if (!this.username || !this.password) return;
    this.cargando = true;
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.cargando = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/matriculas';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.status === 401 ? 'Usuario o contraseña incorrectos.' :
                    err?.status === 0 ? 'No se pudo contactar el servicio de autenticación.' :
                    'Error al iniciar sesión.';
      },
    });
  }
}
