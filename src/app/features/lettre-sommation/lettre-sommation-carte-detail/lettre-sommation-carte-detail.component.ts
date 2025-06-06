import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LettreSommationCarteService } from '../../../services/lettre-sommation-carte.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatutEnum } from '../../../core/models/StatutEnum.model';
import { LettreSommationCarte } from '../../../core/models/lettre-sommation-carte.model';
import { PieceJointe } from '../../../core/models/PieceJointe.model';

@Component({
  selector: 'app-lettre-sommation-carte-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './lettre-sommation-carte-detail.component.html',
  styleUrls: ['./lettre-sommation-carte-detail.component.scss']
})
export class LettreSommationCarteDetailComponent implements OnInit {
  lettreId?: number;
  lettre?: LettreSommationCarte;
  loading = false;
  error = false;
  errorMessage = '';
  
  // File viewing
  selectedFileUrl?: SafeResourceUrl;
  selectedFileName?: string;
  selectedFileId?: number;
  showPdfViewer = false;
  fileLoading = false;
  fileError = false;
  
  // Status enum for template usage
  readonly StatutEnum = StatutEnum;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lettreSommationCarteService: LettreSommationCarteService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.lettreId = +id;
        this.loadLettreSommationCarte();
      } else {
        this.error = true;
        this.errorMessage = 'ID de la lettre de sommation non fourni';
      }
    });
  }

  loadLettreSommationCarte(): void {
    if (!this.lettreId) return;
    
    this.loading = true;
    this.error = false;
    
    this.lettreSommationCarteService.getLettreSommationCarteById(this.lettreId)
      .subscribe({
        next: (data) => {
          this.lettre = data;
          this.loading = false;
          console.log('Lettre loaded with pieces jointes:', data.piecesJointes);
        },
        error: (err) => {
          console.error('Error loading lettre sommation:', err);
          this.loading = false;
          this.error = true;
          this.errorMessage = 'Erreur lors du chargement de la lettre de sommation';
        }
      });
  }

  editLettre(): void {
    if (this.lettreId) {
      this.router.navigate(['/lettres-sommation/carte/edit', this.lettreId]);
    }
  }

  deleteLettre(): void {
    if (!this.lettreId || !this.lettre) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Êtes-vous sûr de vouloir supprimer la lettre de sommation pour la carte n° ${this.lettre.numeroCarte} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.lettreId) {
        this.lettreSommationCarteService.deleteLettreSommationCarte(this.lettreId)
          .subscribe({
            next: () => {
              alert('Lettre de sommation supprimée avec succès');
              this.router.navigate(['/lettres-sommation/carte']);
            },
            error: (err) => {
              console.error('Error deleting lettre sommation:', err);
              alert('Erreur lors de la suppression de la lettre de sommation');
            }
          });
      }
    });
  }

  changeStatut(newStatut: StatutEnum): void {
    if (!this.lettreId || !this.lettre) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de changement de statut',
        message: `Êtes-vous sûr de vouloir changer le statut de la lettre de sommation à "${newStatut}" ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.lettreId && this.lettre) {
        // Create a copy of the current lettre with the new status
        const updatedLettre = {
          ...this.lettre,
          statut: newStatut,
          dateTraitement: newStatut === StatutEnum.REGULARISEE ? new Date().toISOString().split('T')[0] : this.lettre.dateTraitement
        };
        
        // Note: You'll need to implement this method in the service or use a different approach
        // For now, I'll use a FormData approach similar to the create/update
        const formData = new FormData();
        formData.append('lettre', new Blob([JSON.stringify({
          actId: this.lettre.act.id,
          trainId: this.lettre.train.id,
          gareId: this.lettre.gare.id,
          dateCreation: this.lettre.dateCreation,
          dateInfraction: this.lettre.dateInfraction,
          statut: newStatut,
          gareReglement: this.lettre.gareReglement,
          numeroPpRegularisation: this.lettre.numeroPpRegularisation,
          montantAmende: this.lettre.montantAmende,
          typeCarte: this.lettre.typeCarte,
          numeroCarte: this.lettre.numeroCarte,
          commentaires: this.lettre.commentaires,
          dateTraitement: newStatut === StatutEnum.REGULARISEE ? new Date().toISOString().split('T')[0] : this.lettre.dateTraitement
        })], { type: 'application/json' }));
        
        this.lettreSommationCarteService.updateLettreSommationCarte(this.lettreId, formData)
          .subscribe({
            next: (data) => {
              this.lettre = data;
              alert('Statut de la lettre de sommation modifié avec succès');
            },
            error: (err) => {
              console.error('Error updating lettre sommation status:', err);
              alert('Erreur lors de la mise à jour du statut de la lettre de sommation');
            }
          });
      }
    });
  }

  // Enhanced file handling methods
  
  /**
   * View file - handles different file types appropriately
   */
  viewFile(piece: PieceJointe): void {
    if (!piece.id) {
      console.error('File ID is missing');
      return;
    }

    this.selectedFileName = piece.nomFichier;
    this.selectedFileId = piece.id;
    this.fileLoading = true;
    this.fileError = false;

    // Check if it's a viewable file type
    if (this.isViewableFile(piece.typeMime)) {
      // Create a safe URL for viewing
      const fileUrl = this.lettreSommationCarteService.getFileUrl(piece.id);
      this.selectedFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
      this.showPdfViewer = true;
      this.fileLoading = false;
    } else {
      // For non-viewable files, directly download
      this.downloadFile(piece);
      this.fileLoading = false;
    }
  }

  /**
   * Download file with proper filename
   */
  downloadFile(piece: PieceJointe): void {
    if (!piece.id) {
      console.error('File ID is missing');
      return;
    }

    this.fileLoading = true;
    
    this.lettreSommationCarteService.downloadFile(piece.id, piece.nomFichier)
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, piece.nomFichier);
          this.fileLoading = false;
        },
        error: (err) => {
          console.error('Error downloading file:', err);
          alert('Erreur lors du téléchargement du fichier');
          this.fileLoading = false;
        }
      });
  }

  /**
   * Download file from PDF viewer
   */
  downloadCurrentFile(): void {
    if (this.selectedFileId && this.selectedFileName) {
      const piece: PieceJointe = {
        id: this.selectedFileId,
        nomFichier: this.selectedFileName,
        typeDocument: '',
        documentId: 0,
        cheminFichier: '',
        typeMime: '',
        taille: 0,
        dateCreation: ''
      };
      this.downloadFile(piece);
    }
  }

  /**
   * Helper method to create download link and trigger download
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Check if file type can be viewed in browser
   */
  private isViewableFile(mimeType?: string): boolean {
    if (!mimeType) return false;
    
    const viewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      'text/plain',
      'text/html',
      'text/csv'
    ];
    
    return viewableTypes.some(type => mimeType.includes(type));
  }

  /**
   * Close PDF/file viewer
   */
  closePdfViewer(): void {
    this.showPdfViewer = false;
    this.selectedFileUrl = undefined;
    this.selectedFileName = undefined;
    this.selectedFileId = undefined;
    this.fileError = false;
  }

  /**
   * Handle iframe load error
   */
  onFileLoadError(): void {
    this.fileError = true;
    this.fileLoading = false;
  }

  /**
   * Handle iframe load success
   */
  onFileLoadSuccess(): void {
    this.fileLoading = false;
    this.fileError = false;
  }

  /**
   * Get appropriate icon for file type
   */
  getFileIcon(mimeType?: string): string {
    if (!mimeType) return 'fa-file';
    
    if (mimeType.includes('pdf')) return 'fa-file-pdf';
    if (mimeType.includes('image')) return 'fa-file-image';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fa-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fa-file-powerpoint';
    if (mimeType.includes('text')) return 'fa-file-text';
    if (mimeType.includes('video')) return 'fa-file-video';
    if (mimeType.includes('audio')) return 'fa-file-audio';
    
    return 'fa-file';
  }

  /**
   * Get appropriate color for file icon
   */
  getFileIconColor(mimeType?: string): string {
    if (!mimeType) return 'text-gray-500';
    
    if (mimeType.includes('pdf')) return 'text-red-500';
    if (mimeType.includes('image')) return 'text-blue-500';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-700';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-green-600';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'text-orange-500';
    if (mimeType.includes('text')) return 'text-gray-700';
    if (mimeType.includes('video')) return 'text-purple-500';
    if (mimeType.includes('audio')) return 'text-pink-500';
    
    return 'text-gray-500';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get CSS class for status badge
   */
  getStatutClass(statut?: StatutEnum): string {
    if (!statut) return '';
    
    switch (statut) {
      case StatutEnum.REGULARISEE:
        return 'text-green-600 bg-green-100';
      case StatutEnum.NON_REGULARISEE:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
  
  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
  
  /**
   * Navigate back to list
   */
  goBack(): void {
    this.router.navigate(['/lettres-sommation/carte']);
  }

  /**
   * Check if file can be previewed
   */
  canPreviewFile(mimeType?: string): boolean {
    return this.isViewableFile(mimeType);
  }

  /**
   * Get preview button text based on file type
   */
  getPreviewButtonText(mimeType?: string): string {
    if (!mimeType) return 'Voir';
    
    if (mimeType.includes('pdf')) return 'Voir PDF';
    if (mimeType.includes('image')) return 'Voir Image';
    if (mimeType.includes('text')) return 'Voir Texte';
    
    return 'Voir';
  }
}