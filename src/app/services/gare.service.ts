import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { Gare, GareRequest } from '../core/models/gare.model';

@Injectable({
  providedIn: 'root'
})
export class GareService {

  constructor(private authHttp: AuthHttpService) {}

  getAllGares(): Observable<Gare[]> {
    return this.authHttp.get<Gare[]>('/gares');
  }

  getGareById(id: number): Observable<Gare> {
    return this.authHttp.get<Gare>(`/gares/${id}`);
  }

  createGare(gareData: GareRequest): Observable<Gare> {
    return this.authHttp.post<Gare>('/gares', gareData);
  }

  updateGare(id: number, gareData: GareRequest): Observable<Gare> {
    return this.authHttp.put<Gare>(`/gares/${id}`, gareData);
  }

  deleteGare(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/gares/${id}`);
  }
}