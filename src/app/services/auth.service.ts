// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    const loginData = { username, password };
    
    // Set the proper content type header
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Option 1: If the server expects JSON
    return this.http.post(`${this.apiUrl}/login`, loginData, { headers });
    
    // Option 2: If the server expects form data
    // const formData = new FormData();
    // formData.append('username', username);
    // formData.append('password', password);
    // return this.http.post(`${this.apiUrl}/login`, formData);
    
    // Option 3: If you need to handle text response instead of JSON
    // return this.http.post(`${this.apiUrl}/login`, loginData, { 
    //   headers, 
    //   responseType: 'text' 
    // });
  }
}