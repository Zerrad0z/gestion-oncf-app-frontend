// src/app/services/act.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ACT, ACTRequest } from '../core/models/act.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActService {
  private apiUrl = `${environment.apiUrl}/acts`;

  constructor(private http: HttpClient) {}

  getAllActs(): Observable<ACT[]> {
    return this.http.get<ACT[]>(this.apiUrl);
  }

  getActsByAntenneId(antenneId: number): Observable<ACT[]> {
    return this.http.get<ACT[]>(`${this.apiUrl}/antenne/${antenneId}`);
  }

  getActById(id: number): Observable<ACT> {
    return this.http.get<ACT>(`${this.apiUrl}/${id}`);
  }

  getActByMatricule(matricule: string): Observable<ACT> {
    return this.http.get<ACT>(`${this.apiUrl}/matricule/${matricule}`);
  }

  createAct(act: ACTRequest): Observable<ACT> {
    return this.http.post<ACT>(this.apiUrl, act);
  }

  updateAct(id: number, act: ACTRequest): Observable<ACT> {
    return this.http.put<ACT>(`${this.apiUrl}/${id}`, act);
  }

  deleteAct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}