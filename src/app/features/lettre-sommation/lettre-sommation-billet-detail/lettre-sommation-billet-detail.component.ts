import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LettreSommationBilletService } from '../../../services/LettreSommationBillet.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatutEnum } from '../../../core/models/StatutEnum.model';
import { LettreSommationBillet } from '../../../core/models/lettre-sommation-billet.model';
import { PieceJointe } from '../../../core/models/PieceJointe.model';

@Component({
  selector: 'app-lettre-sommation-billet-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './lettre-sommation-billet-detail.component.html',
  styleUrls: ['./lettre-sommation-billet-detail.component.scss']
})
export class LettreSommationBilletDetailComponent implements OnInit {
  lettreId?: number;
  lettre?: LettreSommationBillet;
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
  
  // Status class mappings for UI
  readonly statutClasses = {
    'REGULARISEE': 'text-green-600 bg-green-100',
    'NON REGULARISEE': 'text-red-600 bg-red-100'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lettreSommationBilletService: LettreSommationBilletService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.lettreId = +id;
        this.loadLettreSommationBillet();
      } else {
        this.error = true;
        this.errorMessage = 'ID de la lettre de sommation non fourni';
      }
    });
  }

  loadLettreSommationBillet(): void {
    if (!this.lettreId) return;
    
    this.loading = true;
    this.error = false;
    
    this.lettreSommationBilletService.getLettreSommationBilletById(this.lettreId)
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
      this.router.navigate(['/lettres-sommation/billet/edit', this.lettreId]);
    }
  }

  deleteLettre(): void {
    if (!this.lettreId || !this.lettre) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Êtes-vous sûr de vouloir supprimer la lettre de sommation pour le billet n° ${this.lettre.numeroBillet} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.lettreId) {
        this.lettreSommationBilletService.deleteLettreSommationBillet(this.lettreId)
          .subscribe({
            next: () => {
              alert('Lettre de sommation supprimée avec succès');
              this.router.navigate(['/lettres-sommation/billet']);
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
      const statusUpdate = {
        statut: newStatut,
        dateTraitement: newStatut === StatutEnum.REGULARISEE ? new Date().toISOString().split('T')[0] : this.lettre.dateTraitement
      };
      
      this.lettreSommationBilletService.updateLettreSommationBilletStatus(this.lettreId, statusUpdate)
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

/**
 * Download file with proper filename
 */
downloadFile(piece: PieceJointe): void {
  if (!piece.id) {
    console.error('File ID is missing');
    return;
  }

  this.fileLoading = true;
  
  this.lettreSommationBilletService.downloadFile(piece.id)
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
    this.fileLoading = true;
    
    this.lettreSommationBilletService.downloadFile(this.selectedFileId)
      .subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, this.selectedFileName!);
          this.fileLoading = false;
        },
        error: (err) => {
          console.error('Error downloading file:', err);
          alert('Erreur lors du téléchargement du fichier');
          this.fileLoading = false;
        }
      });
  }
}
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
      const fileUrl = this.lettreSommationBilletService.getFileUrl(piece.id);
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
    return this.statutClasses[statut] || '';
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
    this.router.navigate(['/lettres-sommation/billet']);
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