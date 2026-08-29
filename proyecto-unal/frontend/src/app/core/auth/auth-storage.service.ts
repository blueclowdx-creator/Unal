import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly ACCESS = 'unal_access_token';
  private readonly REFRESH = 'unal_refresh_token';
  private readonly USER = 'unal_user';

  setTokens(access: string, refresh: string, user: { username: string; rol: string; nombreCompleto?: string }) {
    sessionStorage.setItem(this.ACCESS, access);
    sessionStorage.setItem(this.REFRESH, refresh);
    sessionStorage.setItem(this.USER, JSON.stringify(user));
  }

  getAccess(): string | null { return sessionStorage.getItem(this.ACCESS); }
  getRefresh(): string | null { return sessionStorage.getItem(this.REFRESH); }

  getUser(): { username: string; rol: string; nombreCompleto?: string } | null {
    const raw = sessionStorage.getItem(this.USER);
    return raw ? JSON.parse(raw) : null;
  }

  clear() {
    sessionStorage.removeItem(this.ACCESS);
    sessionStorage.removeItem(this.REFRESH);
    sessionStorage.removeItem(this.USER);
  }

  isLoggedIn(): boolean {
    const token = this.getAccess();
    if (!token) return false;
    try {
      const payload = this.decodeJwt(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /** Decodifica el payload JWT sin verificar firma (para UI) */
  decodeJwt(token: string): { sub: string; rol: string; exp: number; iat: number; tipo: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Token invalido');
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded + '==='.slice((padded.length + 3) % 4));
    return JSON.parse(json);
  }
}
