import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { LettreSommationCarte } from '../core/models/lettre-sommation-carte.model';
import { UserRole } from '../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private authService: AuthService) {}

  // ===============================
  // ACT VISUALIZATION PERMISSIONS 
  // ===============================
  
  // ACT Overview and Detail - ENCADRANT, SUPERVISEUR, and ADMIN can access
  canViewACTOverview(): boolean {
    return this.authService.isEncadrant() || this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canViewACTDetail(): boolean {
    return this.authService.isEncadrant() || this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canAccessACTVisualization(): boolean {
    return this.authService.isEncadrant() || this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  // ACT data filtering based on role
  canViewAllACTs(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canViewOwnACTOnly(): boolean {
    return this.authService.isEncadrant() && !this.authService.isSuperviseur() && !this.authService.isAdmin();
  }

  // Dashboard statistics
  canViewDashboardStats(): boolean {
    return this.authService.isLoggedIn(); // All authenticated users can view dashboard
  }

  canViewDetailedStats(): boolean {
    return this.authService.isEncadrant() || this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  // ===============================
  // CONFIGURATION PERMISSIONS (System Management)
  // ===============================
  
  // Sections, Antennes, Gares, Trains - ADMIN only
  canCreateConfiguration(): boolean {
    return this.authService.isAdmin();
  }

  canEditConfiguration(): boolean {
    return this.authService.isAdmin();
  }

  canDeleteConfiguration(): boolean {
    return this.authService.isAdmin();
  }

  canViewConfiguration(): boolean {
    return this.authService.isLoggedIn(); // All authenticated users can view
  }

  // ===============================
  // DOCUMENT PERMISSIONS (Lettres, Rapport-M)
  // ===============================
  
  // Documents - ENCADRANT and ADMIN can create
  canCreateDocument(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
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
    
    return false;
  }

  canDeleteDocument(): boolean {
    return this.authService.isAdmin();
  }

  canUpdateStatus(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canBulkUpdateStatus(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canViewDocument(): boolean {
    return this.authService.isLoggedIn();
  }

  // ===============================
  // SPECIFIC METHODS FOR DIFFERENT ENTITIES
  // ===============================

  // Sections
  canCreateSection(): boolean {
    return this.authService.isAdmin();
  }

  canEditSection(): boolean {
    return this.authService.isAdmin();
  }

  canDeleteSection(): boolean {
    return this.authService.isAdmin();
  }

  // Antennes
  canCreateAntenne(): boolean {
    return this.authService.isAdmin();
  }

  canEditAntenne(): boolean {
    return this.authService.isAdmin();
  }

  canDeleteAntenne(): boolean {
    return this.authService.isAdmin();
  }

  // Gares
  canCreateGare(): boolean {
    return this.authService.isAdmin();
  }

  canEditGare(): boolean {
    return this.authService.isAdmin();
  }

  canDeleteGare(): boolean {
    return this.authService.isAdmin();
  }

  // Trains
  canCreateTrain(): boolean {
    return this.authService.isAdmin();
  }

  canEditTrain(): boolean {
    return this.authService.isAdmin();
  }

  canDeleteTrain(): boolean {
    return this.authService.isAdmin();
  }

  // Lettres
  canCreateLettre(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
  }

  canEditLettre(document: any): boolean {
    return this.canEditDocument(document);
  }

  canDeleteLettre(): boolean {
    return this.authService.isAdmin();
  }

  // Rapport-M
  canCreateRapportM(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
  }

  canEditRapportM(document: any): boolean {
    return this.canEditDocument(document);
  }

  canDeleteRapportM(): boolean {
    return this.authService.isAdmin();
  }

  // ===============================
  // FILE PERMISSIONS
  // ===============================
  
  canUploadFiles(): boolean {
    return this.authService.isEncadrant() || this.authService.isAdmin();
  }

  canDeleteFiles(document: LettreSommationCarte): boolean {
    return this.canEditDocument(document);
  }

  // ===============================
  // USER MANAGEMENT PERMISSIONS
  // ===============================
  
  canManageUsers(): boolean {
    return this.authService.isAdmin();
  }

  canViewUserStats(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  // ===============================
  // NAVIGATION PERMISSIONS
  // ===============================
  
  canAccessAdministration(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperviseur();
  }

  canAccessConfiguration(): boolean {
    return this.authService.isAdmin() || this.authService.isSuperviseur();
  }

  // ===============================
  // REPORT PERMISSIONS
  // ===============================
  
  canGenerateReports(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  canExportData(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  // ===============================
  // SYSTEM SETTINGS PERMISSIONS
  // ===============================
  
  canManageSystemSettings(): boolean {
    return this.authService.isAdmin();
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================
  
  // For sections UI
  shouldShowCreateSectionButton(): boolean {
    return this.canCreateSection();
  }

  shouldShowEditSectionButton(): boolean {
    return this.canEditSection();
  }

  shouldShowDeleteSectionButton(): boolean {
    return this.canDeleteSection();
  }

  // For documents UI
  shouldShowCreateDocumentButton(): boolean {
    return this.canCreateDocument();
  }

  shouldShowEditDocumentButton(document: LettreSommationCarte): boolean {
    return this.canEditDocument(document);
  }

  shouldShowDeleteDocumentButton(): boolean {
    return this.canDeleteDocument();
  }

  shouldShowBulkActionsButton(): boolean {
    return this.canBulkUpdateStatus();
  }

  // For ACT visualization UI 
  shouldShowACTVisualizationMenu(): boolean {
    return this.canAccessACTVisualization();
  }

  shouldShowACTOverviewButton(): boolean {
    return this.canViewACTOverview();
  }

  shouldShowACTDetailButton(): boolean {
    return this.canViewACTDetail();
  }

  
  getAvailableActions(document: LettreSommationCarte): string[] {
    const actions: string[] = [];

    if (this.canViewDocument()) actions.push('view');
    if (this.canEditDocument(document)) actions.push('edit');
    if (this.canDeleteDocument()) actions.push('delete');
    if (this.canUpdateStatus()) actions.push('updateStatus');

    return actions;
  }

  getUserRole(): UserRole | null {
    const user = this.authService.getCurrentUser();
    return user ? user.role : null;
  }

  getUserDisplayName(): string | null {
    const user = this.authService.getCurrentUser();
    return user ? user.nomPrenom : null;
  }

  shouldShowAdminPanel(): boolean {
    return this.authService.isAdmin();
  }

  shouldShowSuperviseurPanel(): boolean {
    return this.authService.isSuperviseur() || this.authService.isAdmin();
  }

  shouldShowEncadrantPanel(): boolean {
    return this.authService.isEncadrant();
  }

  getUserRoleClass(): string {
    const role = this.getUserRole();
    switch (role) {
      case UserRole.ADMIN:
        return 'user-admin';
      case UserRole.SUPERVISEUR:
        return 'user-superviseur';
      case UserRole.ENCADRANT:
        return 'user-encadrant';
      default:
        return 'user-guest';
    }
  }

  getAccessDeniedMessage(action: string): string {
    const role = this.getUserRole();
    
    switch (action) {
      case 'create-section':
        return 'Seuls les administrateurs peuvent créer des sections.';
      case 'create-document':
        return 'Seuls les encadrants peuvent créer des documents.';
      case 'act-visualization':
        return 'Accès réservé aux encadrants, superviseurs et administrateurs.';
      case 'edit':
        return role === UserRole.ENCADRANT 
          ? 'Vous ne pouvez modifier que vos propres documents.' 
          : 'Vous n\'avez pas les droits pour modifier ce document.';
      case 'delete':
        return 'Seuls les administrateurs peuvent supprimer des éléments.';
      case 'bulk':
        return 'Seuls les superviseurs et administrateurs peuvent effectuer des actions en lot.';
      case 'administration':
        return 'Accès réservé aux superviseurs et administrateurs.';
      default:
        return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
  }

  filterDocumentsByPermission(documents: LettreSommationCarte[]): LettreSommationCarte[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    // Admin and Superviseur see all documents
    if (this.authService.isAdmin() || this.authService.isSuperviseur()) {
      return documents;
    }

    // Encadrant sees only their own documents
    if (this.authService.isEncadrant()) {
      return documents.filter(doc => 
        doc.utilisateur && doc.utilisateur.id === currentUser.id
      );
    }

    return [];
  }

  canAccessRoute(route: string): boolean {
    switch (route) {
      case '/administration':
        return this.canAccessAdministration();
      case '/configuration':
        return this.canAccessConfiguration();
      case '/configuration/sections/create':
        return this.canCreateSection();
      case '/lettres-sommation/carte/create':
        return this.canCreateDocument();
      // NEW ACT Visualization routes
      case '/act-visualization':
      case '/act-visualization/overview':
        return this.canViewACTOverview();
      case '/act-visualization/detail':
        return this.canViewACTDetail();
      case '/acts':
      case '/act-overview':
        return this.canViewACTOverview();
      default:
        return this.authService.isLoggedIn();
    }
  }
}