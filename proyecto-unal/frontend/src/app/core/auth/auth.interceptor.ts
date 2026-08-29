import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, switchMap, catchError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from './auth.service';

let refreshing = false;
const refreshed$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  let cloned = req;
  if (token && !req.url.includes('/api/auth/')) {
    cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(cloned).pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/api/auth/')) {
        if (!refreshing) {
          refreshing = true;
          refreshed$.next(null);
          return auth.refresh().pipe(
            switchMap((res) => {
              refreshing = false;
              if (!res) {
                auth.logout();
                return throwError(() => new Error('Sesion expirada'));
              }
              refreshed$.next(res.accessToken);
              return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.accessToken}` } }));
            }),
            catchError(e => {
              refreshing = false;
              auth.logout();
              return throwError(() => e);
            })
          );
        }
        return refreshed$.pipe(
          filter(t => t != null),
          take(1),
          switchMap(t => next(req.clone({ setHeaders: { Authorization: `Bearer ${t}` } })))
        );
      }
      return throwError(() => err);
    })
  );
};
