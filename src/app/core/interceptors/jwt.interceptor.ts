import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔍 JWT Interceptor called for:', request.method, request.url);
    
    // Add JWT token to requests
    const token = this.authService.getToken();
    console.log('🔑 Token from AuthService:', token ? 'EXISTS' : 'NULL');
    console.log('🔑 Token length:', token?.length);
    console.log('🔑 Token preview:', token ? token.substring(0, 30) + '...' : 'No token');
    
    const isAuthUrl = this.isAuthUrl(request.url);
    console.log('🌐 Is auth URL:', isAuthUrl);
    
    if (token && !isAuthUrl) {
      console.log('✅ Adding token to request headers');
      request = this.addTokenHeader(request, token);
      console.log('📤 Headers after adding token:', request.headers.keys().map(key => `${key}: ${request.headers.get(key)}`));
    } else {
      console.log('❌ NOT adding token because:', !token ? 'No token' : 'Auth URL');
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🚨 HTTP Error in interceptor:', error.status, error.message);
        
        if (error.status === 401 && !this.isAuthUrl(request.url)) {
          console.log('🔓 401 error, logging out user');
          // Token expired or invalid, logout user
          this.authService.logoutLocal();
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    console.log('🔧 Adding Authorization header with token');
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  private isAuthUrl(url: string): boolean {
    const isAuth = url.includes('/api/v1/auth/login') || 
                   url.includes('/api/v1/auth/logout') || 
                   url.includes('/api/v1/auth/');
    console.log('🔍 Checking if auth URL:', url, '-> isAuth:', isAuth);
    return isAuth;
  }
}