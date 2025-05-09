// src/app/core/services/antenne.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Antenne } from '../core/models/antenne.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AntenneService {
  private apiUrl = `${environment.apiUrl}/antennes`;

  constructor(private http: HttpClient) { }

  getAllAntennes(): Observable<Antenne[]> {
    return this.http.get<Antenne[]>(this.apiUrl);
  }

  getAntenneById(id: number): Observable<Antenne> {
    return this.http.get<Antenne>(`${this.apiUrl}/${id}`);
  }

  createAntenne(antenne: Partial<Antenne>): Observable<Antenne> {
    return this.http.post<Antenne>(this.apiUrl, antenne);
  }

  updateAntenne(id: number, antenne: Partial<Antenne>): Observable<Antenne> {
    return this.http.put<Antenne>(`${this.apiUrl}/${id}`, antenne);
  }

  deleteAntenne(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Add this method for filtering antennes by section
  getAntennesBySection(sectionId: number): Observable<Antenne[]> {
    return this.http.get<Antenne[]>(`${this.apiUrl}/bysection/${sectionId}`);
  }
}