// src/app/services/lettre-sommation-carte.service.ts
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthHttpService } from './auth-http.service';
import { AuthService } from './auth.service';
import { LettreSommationCarte, LettreSommationCarteRequest, BulkUpdateStatusRequest } from '../core/models/lettre-sommation-carte.model';
import { StatutEnum } from '../core/models/StatutEnum.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LettreSommationCarteService {

  constructor(
    private authHttp: AuthHttpService,
    private authService: AuthService
  ) {}

  getAllLettresSommationCarte(): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>('/lettres-sommation-carte');
  }

  getLettreSommationCarteById(id: number): Observable<LettreSommationCarte> {
    return this.authHttp.get<LettreSommationCarte>(`/lettres-sommation-carte/${id}`);
  }

  updateLettreSommationCarte(id: number, formData: FormData): Observable<LettreSommationCarte> {
  if (!this.canUpdate()) {
    return throwError(() => new Error('Vous n\'avez pas les droits pour modifier des lettres de sommation'));
  }
  return this.authHttp.uploadPut<LettreSommationCarte>(`/lettres-sommation-carte/${id}`, formData);
}

createLettreSommationCarte(formData: FormData): Observable<LettreSommationCarte> {
  if (!this.canCreate()) {
    return throwError(() => new Error('Vous n\'avez pas les droits pour créer des lettres de sommation'));
  }
  return this.authHttp.upload<LettreSommationCarte>('/lettres-sommation-carte', formData);
}

  deleteLettreSommationCarte(id: number): Observable<void> {
    if (!this.canDelete()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour supprimer des lettres de sommation'));
    }
    return this.authHttp.delete<void>(`/lettres-sommation-carte/${id}`);
  }

  searchLettresSommationCarte(
    actId?: number,
    gareId?: number,
    trainId?: number,
    statut?: StatutEnum,
    numeroCarte?: string,
    typeCarte?: string,
    dateDebut?: string,
    dateFin?: string
  ): Observable<LettreSommationCarte[]> {
    const params: any = {};
    if (actId) params.actId = actId;
    if (gareId) params.gareId = gareId;
    if (trainId) params.trainId = trainId;
    if (statut) params.statut = statut;
    if (numeroCarte) params.numeroCarte = numeroCarte;
    if (typeCarte) params.typeCarte = typeCarte;
    if (dateDebut) params.dateDebut = dateDebut;
    if (dateFin) params.dateFin = dateFin;

    return this.authHttp.get<LettreSommationCarte[]>('/lettres-sommation-carte/search', params);
  }

  getLettreSommationCarteByActId(actId: number): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>(`/lettres-sommation-carte/act/${actId}`);
  }

  getLettreSommationCarteByGareId(gareId: number): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>(`/lettres-sommation-carte/gare/${gareId}`);
  }

  getLettreSommationCarteByTrainId(trainId: number): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>(`/lettres-sommation-carte/train/${trainId}`);
  }

  getLettreSommationCarteByStatut(statut: StatutEnum): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>(`/lettres-sommation-carte/statut/${statut}`);
  }

  getLettreSommationCarteByDateRange(dateDebut: string, dateFin: string): Observable<LettreSommationCarte[]> {
    return this.authHttp.get<LettreSommationCarte[]>('/lettres-sommation-carte/dates', { dateDebut, dateFin });
  }

  existsLettreSommationCarteByNumeroCarte(numeroCarte: string): Observable<boolean> {
    return this.authHttp.get<boolean>('/lettres-sommation-carte/check-numero-carte', { numeroCarte });
  }

  updateBulkStatus(ids: number[], newStatus: string, commentaire?: string): Observable<LettreSommationCarte[]> {
    if (!this.canUpdateBulkStatus()) {
      return throwError(() => new Error('Vous n\'avez pas les droits pour modifier le statut en lot'));
    }
    const request: BulkUpdateStatusRequest = {
      ids,
      newStatus: newStatus as StatutEnum,
      commentaire
    };
    return this.authHttp.put<LettreSommationCarte[]>('/lettres-sommation-carte/bulk/status', request);
  }

  // File handling methods
  getFileUrl(fileId: number): string {
    return `${environment.apiUrl}/files/${fileId}/view`;
  }

  downloadFile(fileId: number, fileName: string): Observable<Blob> {
    return this.authHttp.download(`/files/${fileId}/download`);
  }

  // Permission check methods
  canCreate(): boolean {
    return this.authService.isEncadrant();
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

  canEditDocument(document: LettreSommationCarte): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) return false;
    
    // Admin can edit any document
    if (this.authService.isAdmin()) return true;
    
    // Encadrant can only edit their own documents
    if (this.authService.isEncadrant()) {
      return document.utilisateur && document.utilisateur.id === currentUser.id;
    }
    
    // Superviseur cannot edit documents directly
    return false;
  }

  // Check if current user can view edit/delete buttons for a specific document
  getDocumentActions(document: LettreSommationCarte): { canEdit: boolean; canDelete: boolean; canViewFiles: boolean } {
    return {
      canEdit: this.canEditDocument(document),
      canDelete: this.canDelete(),
      canViewFiles: this.canView()
    };
  }

  // Get role-specific message for permission denials
  getPermissionDeniedMessage(action: string): string {
    const role = this.authService.getCurrentUser()?.role;
    
    switch (action) {
      case 'create':
        return 'Seuls les encadrants peuvent créer des lettres de sommation.';
      case 'edit':
        return role === 'ENCADRANT' 
          ? 'Vous ne pouvez modifier que vos propres lettres de sommation.' 
          : 'Seuls les encadrants et administrateurs peuvent modifier des lettres de sommation.';
      case 'delete':
        return 'Seuls les administrateurs peuvent supprimer des lettres de sommation.';
      case 'bulk_status':
        return 'Seuls les superviseurs et administrateurs peuvent modifier le statut en lot.';
      default:
        return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
  }
}