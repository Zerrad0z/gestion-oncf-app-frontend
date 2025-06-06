import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Functional JWT Interceptor
const jwtInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Skip auth endpoints
  if (req.url.includes('/api/v1/auth/')) {
    return next(req);
  }
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    // Clone request with Authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};

// Error handling interceptor
const errorInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/v1/auth/')) {
        // Token expired or invalid, clear storage and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    // Use modern functional interceptors
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true
    })
  ]
};