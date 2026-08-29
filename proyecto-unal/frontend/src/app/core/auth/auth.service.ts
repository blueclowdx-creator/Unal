import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, throwError, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from './auth-storage.service';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  rol: string;
  nombreCompleto?: string;
}

export interface UsuarioActual {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/auth`;
  private currentUser$ = new BehaviorSubject<UsuarioActual | null>(null);

  constructor(private http: HttpClient, private storage: AuthStorageService) {
    if (this.storage.isLoggedIn()) {
      const u = this.storage.getUser();
      if (u) this.currentUser$.next({ id: 0, username: u.username, email: '', nombreCompleto: u.nombreCompleto || '', rol: u.rol, enabled: true });
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { username, password }).pipe(
      tap(res => {
        this.storage.setTokens(res.accessToken, res.refreshToken, {
          username: res.username, rol: res.rol, nombreCompleto: res.nombreCompleto,
        });
        this.currentUser$.next({
          id: 0, username: res.username, email: '',
          nombreCompleto: res.nombreCompleto || res.username,
          rol: res.rol, enabled: true,
        });
      })
    );
  }

  refresh(): Observable<LoginResponse | null> {
    const refresh = this.storage.getRefresh();
    if (!refresh) return of(null);
    return this.http.post<LoginResponse>(`${this.base}/refresh`, { refreshToken: refresh }).pipe(
      tap(res => {
        this.storage.setTokens(res.accessToken, res.refreshToken, {
          username: res.username, rol: res.rol, nombreCompleto: res.nombreCompleto,
        });
      }),
      catchError(err => {
        this.storage.clear();
        this.currentUser$.next(null);
        return of(null);
      })
    );
  }

  logout() {
    this.storage.clear();
    this.currentUser$.next(null);
  }

  me(): Observable<UsuarioActual> {
    return this.http.get<UsuarioActual>(`${this.base}/me`);
  }

  get user$() { return this.currentUser$.asObservable(); }
  get currentUser() { return this.currentUser$.value; }
  isAuthenticated() { return this.storage.isLoggedIn(); }
  getAccessToken() { return this.storage.getAccess(); }
}
