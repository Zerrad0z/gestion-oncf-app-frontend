import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { LettreSommationBillet, LettreSommationBilletRequest } from '../core/models/lettre-sommation-billet.model';

@Injectable({
  providedIn: 'root'
})
export class LettreSommationBilletService {

  constructor(private authHttp: AuthHttpService) {}

  getAllLettresSommationBillet(): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>('/lettres-sommation-billet');
  }

  getLettreSommationBilletById(id: number): Observable<LettreSommationBillet> {
    return this.authHttp.get<LettreSommationBillet>(`/lettres-sommation-billet/${id}`);
  }

  createLettreSommationBillet(formData: FormData): Observable<LettreSommationBillet> {
    return this.authHttp.upload<LettreSommationBillet>('/lettres-sommation-billet', formData);
  }

  // EXISTING METHOD - for file uploads
  updateLettreSommationBillet(id: number, formData: FormData): Observable<LettreSommationBillet> {
    return this.authHttp.uploadPut<LettreSommationBillet>(`/lettres-sommation-billet/${id}`, formData);
  }

  // NEW METHOD - for simple status updates without files
  updateLettreSommationBilletStatus(id: number, lettre: Partial<LettreSommationBillet>): Observable<LettreSommationBillet> {
    return this.authHttp.put<LettreSommationBillet>(`/lettres-sommation-billet/${id}`, lettre);
  }

  deleteLettreSommationBillet(id: number): Observable<void> {
    return this.authHttp.delete<void>(`/lettres-sommation-billet/${id}`);
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
    const params: any = {};
    if (actId) params.actId = actId;
    if (gareId) params.gareId = gareId;
    if (trainId) params.trainId = trainId;
    if (statut) params.statut = statut;
    if (numeroBillet) params.numeroBillet = numeroBillet;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;

    return this.authHttp.get<LettreSommationBillet[]>('/lettres-sommation-billet/search', params);
  }

  getLettreSommationBilletByActId(actId: number): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>(`/lettres-sommation-billet/act/${actId}`);
  }

  getLettreSommationBilletByGareId(gareId: number): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>(`/lettres-sommation-billet/gare/${gareId}`);
  }

  getLettreSommationBilletByTrainId(trainId: number): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>(`/lettres-sommation-billet/train/${trainId}`);
  }

  getLettreSommationBilletByStatut(statut: string): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>(`/lettres-sommation-billet/statut/${statut}`);
  }

  getLettreSommationBilletByDateRange(dateDebut: string, dateFin: string): Observable<LettreSommationBillet[]> {
    return this.authHttp.get<LettreSommationBillet[]>('/lettres-sommation-billet/dates', { dateDebut, dateFin });
  }

  checkNumeroBillet(numeroBillet: string): Observable<boolean> {
    return this.authHttp.get<boolean>('/lettres-sommation-billet/check-numero-billet', { numeroBillet });
  }

  updateBulkStatus(ids: number[], newStatus: string, commentaire?: string): Observable<LettreSommationBillet[]> {
    return this.authHttp.put<LettreSommationBillet[]>('/lettres-sommation-billet/bulk/status', {
      ids,
      newStatus,
      commentaire
    });
  }

  // FIXED METHOD - removed unused filename parameter
  downloadFile(fileId: number): Observable<Blob> {
    return this.authHttp.download(`/files/${fileId}/download`);
  }

  getFileUrl(fileId: number): string {
    return `/api/v1/files/${fileId}/view`;
  }
}