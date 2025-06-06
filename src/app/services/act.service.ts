import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { ACT, ACTRequest } from '../core/models/act.model';

@Injectable({
  providedIn: 'root'
})
export class ActService {

  constructor(private authHttp: AuthHttpService) {}

  getAllActs(): Observable<ACT[]> {
    return this.authHttp.get<ACT[]>('/acts');
  }

  getActsByAntenneId(antenneId: number): Observable<ACT[]> {
    return this.authHttp.get<ACT[]>(`/acts/antenne/${antenneId}`);
  }

  getActById(id: number): Observable<ACT> {
    return this.authHttp.get<ACT>(`/acts/${id}`);
  }

  getActByMatricule(matricule: string): Observable<ACT> {
    return this.authHttp.get<ACT>(`/acts/matricule/${matricule}`);
  }

  createAct(act: ACTRequest): Observable<ACT> {
    return this.authHttp.post<ACT>('/acts', act);
  }

  updateAct(id: number, act: ACTRequest): Observable<ACT> {
    return this.authHttp.put<ACT>(`/acts/${id}`, act);
  }

  deleteAct(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/acts/${id}`);
  }
}