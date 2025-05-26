import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LettreSommationBillet } from '../core/models/lettre-sommation-billet.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LettreSommationBilletService {
  private baseUrl = `${environment.apiUrl}/lettres-sommation-billet`;
  private filesUrl = `${environment.apiUrl}/files`; // Assuming your file endpoint

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

  updateLettreSommationBillet(id: number, updatedLettre: any): Observable<LettreSommationBillet> {
    // Create FormData if we have files, otherwise do a regular PUT request
    if (updatedLettre instanceof FormData) {
      return this.http.put<LettreSommationBillet>(`${this.baseUrl}/${id}`, updatedLettre);
    } else {
      // For simple status updates without files
      return this.http.put<LettreSommationBillet>(`${this.baseUrl}/${id}`, updatedLettre);
    }
  }

  // File operations
  
  /**
   * Get file content as blob for viewing/downloading
   */
  getFileBlob(fileId: number): Observable<Blob> {
    return this.http.get(`${this.filesUrl}/${fileId}`, {
      responseType: 'blob'
    });
  }

  /**
   * Get file URL for viewing (returns the direct URL)
   */
  getFileUrl(fileId: number): string {
    return `${this.filesUrl}/${fileId}`;
  }

  /**
   * Download file directly
   */
  downloadFile(fileId: number, fileName: string): Observable<Blob> {
    return this.http.get(`${this.filesUrl}/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Get file metadata
   */
  getFileMetadata(fileId: number): Observable<any> {
    return this.http.get(`${this.filesUrl}/${fileId}/metadata`);
  }

  /**
   * Check if file exists and is accessible
   */
  checkFileAccess(fileId: number): Observable<boolean> {
    return this.http.head(`${this.filesUrl}/${fileId}`, {
      observe: 'response'
    }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }
}