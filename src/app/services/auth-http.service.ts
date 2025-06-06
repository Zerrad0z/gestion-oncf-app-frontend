// src/app/core/services/auth-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Create authenticated headers
  private createHeaders(includeContentType: boolean = true): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  // Build HTTP params from object
  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => httpParams = httpParams.append(key, v.toString()));
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    
    return httpParams;
  }

  // Error handler
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    if (error.status === 401) {
      // Token expired or invalid - clear auth data and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      this.router.navigate(['/login'], { 
        queryParams: { message: 'Session expired. Please log in again.' }
      });
    }
    return throwError(() => error);
  };

  // HTTP Methods
  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    const headers = this.createHeaders();
    const httpParams = this.buildParams(params);
    
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { 
      headers, 
      params: httpParams 
    }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, body?: any): Observable<T> {
    const headers = this.createHeaders();
    
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, { 
      headers 
    }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, body?: any): Observable<T> {
    const headers = this.createHeaders();
    
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, { 
      headers 
    }).pipe(
      catchError(this.handleError)
    );
  }

  patch<T>(endpoint: string, body?: any): Observable<T> {
    const headers = this.createHeaders();
    
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, { 
      headers 
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const headers = this.createHeaders();
    
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { 
      headers 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // File upload method
  // File upload method for PUT requests (updates)
uploadPut<T>(endpoint: string, formData: FormData): Observable<T> {
  // For file uploads, don't set Content-Type (browser handles it)
  const headers = this.createHeaders(false);
  
  return this.http.put<T>(`${this.baseUrl}${endpoint}`, formData, { 
    headers 
  }).pipe(
    catchError(this.handleError)
  );
}

// Keep your existing upload method for POST requests (creates)
upload<T>(endpoint: string, formData: FormData): Observable<T> {
  // For file uploads, don't set Content-Type (browser handles it)
  const headers = this.createHeaders(false);
  
  return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, { 
    headers 
  }).pipe(
    catchError(this.handleError)
  );
}

  // Download method for files
  download(endpoint: string, filename?: string): Observable<Blob> {
    const headers = this.createHeaders(false);
    
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }
}