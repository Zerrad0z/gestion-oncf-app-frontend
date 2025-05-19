// src/app/core/services/gare.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gare, GareRequest } from '../core/models/gare.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GareService {
  private apiUrl = `${environment.apiUrl}/gares`;

  constructor(private http: HttpClient) { }

  getAllGares(): Observable<Gare[]> {
    return this.http.get<Gare[]>(this.apiUrl);
  }

  getGareById(id: number): Observable<Gare> {
    return this.http.get<Gare>(`${this.apiUrl}/${id}`);
  }

  createGare(gareData: GareRequest): Observable<Gare> {
    return this.http.post<Gare>(this.apiUrl, gareData);
  }

  updateGare(id: number, gareData: GareRequest): Observable<Gare> {
    return this.http.put<Gare>(`${this.apiUrl}/${id}`, gareData);
  }

  deleteGare(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}