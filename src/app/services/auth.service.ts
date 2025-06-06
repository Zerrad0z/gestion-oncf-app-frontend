import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { LoginRequest, LoginResponse, ChangePasswordRequest, MessageResponse } from '../core/models/auth.model';
import { User } from '../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`);
  }

  changePassword(changePasswordRequest: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/change-password`, changePasswordRequest);
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/logout`, {})
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/login']);
        })
      );
  }

  logoutLocal(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(authResult: LoginResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    
    const user: User = {
      id: authResult.id,
      matricule: authResult.matricule,
      nomPrenom: authResult.nomPrenom,
      nomUtilisateur: authResult.nomUtilisateur,
      email: authResult.email,
      role: authResult.role,
      actif: authResult.actif,
      actId: authResult.actId,
      actNomPrenom: authResult.actNomPrenom
    };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  private getUserFromStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem(this.USER_KEY);
      }
    }
    return null;
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  getCurrentUser(): User | null {
    let user = this.currentUserSubject.value;
    
    if (!user) {
      user = this.getUserFromStorage();
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
    
    return user;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isSuperviseur(): boolean {
    return this.hasRole('SUPERVISEUR');
  }

  isEncadrant(): boolean {
    return this.hasRole('ENCADRANT');
  }
}