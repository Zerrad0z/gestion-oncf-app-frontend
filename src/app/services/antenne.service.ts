import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { Antenne } from '../core/models/antenne.model';

@Injectable({
  providedIn: 'root'
})
export class AntenneService {

  constructor(private authHttp: AuthHttpService) {}

  getAllAntennes(): Observable<Antenne[]> {
    return this.authHttp.get<Antenne[]>('/antennes');
  }

  getAntenneById(id: number): Observable<Antenne> {
    return this.authHttp.get<Antenne>(`/antennes/${id}`);
  }

  createAntenne(antenne: Partial<Antenne>): Observable<Antenne> {
    return this.authHttp.post<Antenne>('/antennes', antenne);
  }

  updateAntenne(id: number, antenne: Partial<Antenne>): Observable<Antenne> {
    return this.authHttp.put<Antenne>(`/antennes/${id}`, antenne);
  }

  deleteAntenne(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/antennes/${id}`);
  }

  getAntennesBySection(sectionId: number): Observable<Antenne[]> {
    return this.authHttp.get<Antenne[]>(`/antennes/bysection/${sectionId}`);
  }
}