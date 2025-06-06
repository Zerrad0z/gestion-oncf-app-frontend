import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthHttpService } from './auth-http.service'; // ✅ Use AuthHttpService instead of HttpClient
import { AuthService } from './auth.service'; // ✅ Add AuthService for permission checks
import { RapportM, RapportMRequest, BulkUpdateStatusRequest } from '../core/models/rapportM.model';
import { CategorieRapportEnum } from '../core/models/CategorieRapportEnum.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RapportMService {

  constructor(
    private authHttp: AuthHttpService, // ✅ Changed from HttpClient to AuthHttpService
    private authService: AuthService   // ✅ Added for permission checks
  ) {
    console.log('RapportMService initialized with API URL:', environment.apiUrl);
  }

  getAllRapportsM(): Observable<RapportM[]> {
    return this.authHttp.get<RapportM[]>('/rapports-m'); // ✅ Using AuthHttpService
  }

  getRapportMById(id: number): Observable<RapportM> {
    return this.authHttp.get<RapportM>(`/rapports-m/${id}`);
  }

  createRapportM(formData: FormData): Observable<RapportM> {
    if (!this.canCreate()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour créer des rapports'));
    }
    return this.authHttp.upload<RapportM>('/rapports-m', formData); // ✅ Using upload method
  }

  updateRapportM(id: number, formData: FormData): Observable<RapportM> {
    if (!this.canUpdate()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour modifier des rapports'));
    }
    return this.authHttp.uploadPut<RapportM>(`/rapports-m/${id}`, formData); // ✅ Using uploadPut method
  }

  deleteRapportM(id: number): Observable<void> {
    if (!this.canDelete()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour supprimer des rapports'));
    }
    return this.authHttp.delete<void>(`/rapports-m/${id}`);
  }

  searchRapportsM(
    actId?: number,
    categorie?: CategorieRapportEnum,
    references?: string,
    objet?: string,
    detail?: string,
    dateDebut?: string,
    dateFin?: string
  ): Observable<RapportM[]> {
    const params: any = {}; // ✅ Using object instead of HttpParams
    
    if (actId) params.actId = actId;
    if (categorie) params.categorie = categorie;
    if (references) params.references = references;
    if (objet) params.objet = objet;
    if (detail) params.detail = detail;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;

    return this.authHttp.get<RapportM[]>('/rapports-m/search', params);
  }

  getRapportMByActId(actId: number): Observable<RapportM[]> {
    return this.authHttp.get<RapportM[]>(`/rapports-m/act/${actId}`);
  }

  getRapportMByCategorie(categorie: CategorieRapportEnum): Observable<RapportM[]> {
    return this.authHttp.get<RapportM[]>(`/rapports-m/categorie/${categorie}`);
  }

  getRapportMByDateRange(dateDebut: string, dateFin: string): Observable<RapportM[]> {
    return this.authHttp.get<RapportM[]>('/rapports-m/dates', { dateDebut, dateFin });
  }

  updateBulkStatus(request: BulkUpdateStatusRequest): Observable<RapportM[]> {
    if (!this.canUpdateBulkStatus()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour modifier le statut en lot'));
    }
    return this.authHttp.put<RapportM[]>('/rapports-m/bulk/status', request);
  }

  // File handling methods
  getFileUrl(fileId: number): string {
    return `${environment.apiUrl}/pieces-jointes/${fileId}/view`;
  }

  downloadFile(fileId: number, fileName: string): Observable<Blob> {
    return this.authHttp.download(`/pieces-jointes/${fileId}/download`).pipe(
      tap(() => console.log(`Downloading file: ${fileName}`)),
      catchError(error => {
        console.error('Error downloading file:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ Added permission check methods (like in LettreSommationCarteService)
  canCreate(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
  }

  canUpdate(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  canUpdateBulkStatus(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canView(): boolean {
    return this.authService.isLoggedIn();
  }

  canEditDocument(document: RapportM): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) return false;
    
    // Admin can edit any document
    if (this.authService.isAdmin()) return true;
    
    // Encadrant can only edit their own documents
    if (this.authService.isEncadrant()) {
      return document.utilisateur && document.utilisateur.id === currentUser.id;
    }
    
    return false;
  }

  // Get role-specific message for permission denials
  getPermissionDeniedMessage(action: string): string {
    const role = this.authService.getCurrentUser()?.role;
    
    switch (action) {
      case 'create':
        return 'Seuls les encadrants peuvent créer des rapports.';
      case 'edit':
        return role === 'ENCADRANT' 
          ? 'Vous ne pouvez modifier que vos propres rapports.' 
          : 'Seuls les encadrants et administrateurs peuvent modifier des rapports.';
      case 'delete':
        return 'Seuls les administrateurs peuvent supprimer des rapports.';
      case 'bulk_status':
        return 'Seuls les superviseurs et administrateurs peuvent modifier le statut en lot.';
      default:
        return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
  }
}