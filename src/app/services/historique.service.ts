import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {
  private apiUrl = `${environment.apiUrl}/historique`;

  constructor(private http: HttpClient) { }

  getHistoriqueForEntity(typeEntite: string, entiteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/entity/${typeEntite}/${entiteId}`);
  }

  getHistoriqueForUser(utilisateurId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${utilisateurId}`);
  }

  getHistoriqueBetweenDates(debut: Date, fin: Date, page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('debut', debut.toISOString())
      .set('fin', fin.toISOString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/date`, { params });
  }

  getHistoriqueByEntityType(typeEntite: string, page: number = 0, size: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/type/${typeEntite}`, { params });
  }
}