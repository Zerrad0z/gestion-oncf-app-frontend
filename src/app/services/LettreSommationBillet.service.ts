import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LettreSommationBillet } from '../core/models/lettre-sommation-billet.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LettreSommationBilletService {
  private baseUrl = `${environment.apiUrl}/lettres-sommation-billet`;

  constructor(private http: HttpClient) { }

  getAllLettresSommationBillet(): Observable<LettreSommationBillet[]> {
    return this.http.get<LettreSommationBillet[]>(this.baseUrl);
  }

  getLettreSommationBilletById(id: number): Observable<LettreSommationBillet> {
    return this.http.get<LettreSommationBillet>(`${this.baseUrl}/${id}`);
  }

  createLettreSommationBillet(formData: FormData): Observable<LettreSommationBillet> {
    return this.http.post<LettreSommationBillet>(this.baseUrl, formData);
  }

  updateLettreSommationBillet(id: number, formData: FormData): Observable<LettreSommationBillet> {
    return this.http.put<LettreSommationBillet>(`${this.baseUrl}/${id}`, formData);
  }

  deleteLettreSommationBillet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  searchLettresSommationBillet(
    actId?: number,
    gareId?: number,
    trainId?: number,
    statut?: string,
    numeroBillet?: string,
    dateDebut?: string,
    dateFin?: string
  ): Observable<LettreSommationBillet[]> {
    let params = new HttpParams();

    if (actId) params = params.set('actId', actId.toString());
    if (gareId) params = params.set('gareId', gareId.toString());
    if (trainId) params = params.set('trainId', trainId.toString());
    if (statut) params = params.set('statut', statut);
    if (numeroBillet) params = params.set('numeroBillet', numeroBillet);
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);

    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/search`, { params });
  }

  getLettreSommationBilletByActId(actId: number): Observable<LettreSommationBillet[]> {
    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/act/${actId}`);
  }

  getLettreSommationBilletByGareId(gareId: number): Observable<LettreSommationBillet[]> {
    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/gare/${gareId}`);
  }

  getLettreSommationBilletByTrainId(trainId: number): Observable<LettreSommationBillet[]> {
    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/train/${trainId}`);
  }

  getLettreSommationBilletByStatut(statut: string): Observable<LettreSommationBillet[]> {
    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getLettreSommationBilletByDateRange(dateDebut: string, dateFin: string): Observable<LettreSommationBillet[]> {
    let params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    
    return this.http.get<LettreSommationBillet[]>(`${this.baseUrl}/dates`, { params });
  }

  checkNumeroBillet(numeroBillet: string): Observable<boolean> {
    let params = new HttpParams().set('numeroBillet', numeroBillet);
    return this.http.get<boolean>(`${this.baseUrl}/check-numero-billet`, { params });
  }

  updateBulkStatus(ids: number[], newStatus: string, commentaire: string): Observable<LettreSommationBillet[]> {
    return this.http.put<LettreSommationBillet[]>(`${this.baseUrl}/bulk/status`, {
      ids,
      newStatus,
      commentaire
    });
  }
}