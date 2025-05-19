import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LettreSommationBilletService } from '../../../services/LettreSommationBillet.service';
import { ToastrService } from 'ngx-toastr';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

enum StatutEnum {
  NON_TRAITEE = 'NON_TRAITEE',
  EN_COURS = 'EN_COURS',
  URGENT = 'URGENT',
  TRAITE = 'TRAITE',
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON_REGULARISEE',
  REJETE = 'REJETE'
}

@Component({
  selector: 'app-lettre-sommation-billet-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatDialogModule,
    StatusBadgeComponent
  ],
  templateUrl: './lettre-sommation-billet-list.component.html',
  styleUrls: ['./lettre-sommation-billet-list.component.scss']
})
export class LettreSommationBilletListComponent implements OnInit {
  lettres: any[] = [];
  filteredLettres: any[] = [];
  loading = false;
  error = '';
  
  // Pagination
  page = 0;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtering
  searchTerm = '';
  filterStatus: StatutEnum | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  
  // Bulk actions
  selectedLettres: any[] = [];
  newStatus: StatutEnum | null = null;
  bulkComment = '';
  
  statuts = Object.values(StatutEnum);
  dropdownOpen = false;

  constructor(
    private lettreSommationBilletService: LettreSommationBilletService,
    private router: Router,
    private dialog: MatDialog,
    //private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadLettres();
  }

  loadLettres(): void {
    this.loading = true;
    this.lettreSommationBilletService.getAllLettresSommationBillet()
      .subscribe({
        next: (data) => {
          this.lettres = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors du chargement des lettres de sommation.';
          this.loading = false;
          //this.toastr.error(this.error, 'Erreur');
        }
      });
  }

  applyFilters(): void {
    let result = this.lettres;

    // Apply text search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(lettre => 
        lettre.numeroBillet?.toLowerCase().includes(term) ||
        lettre.act?.nomPrenom?.toLowerCase().includes(term) ||
        lettre.act?.matricule?.toLowerCase().includes(term) ||
        lettre.gare?.nom?.toLowerCase().includes(term) ||
        lettre.motifInfraction?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.filterStatus) {
      result = result.filter(lettre => lettre.statut === this.filterStatus);
    }

    // Apply date range filter
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      result = result.filter(lettre => {
        const date = new Date(lettre.dateInfraction);
        return date >= start && date <= end;
      });
    }

    this.filteredLettres = result;
    this.totalItems = result.length;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get paginatedLettres(): any[] {
    const startIndex = this.page * this.pageSize;
    return this.filteredLettres.slice(startIndex, startIndex + this.pageSize);
  }

  viewDetails(id: number): void {
    this.router.navigate(['/lettres-sommation/billet', id]);
  }

  createNew(): void {
    this.router.navigate(['/lettres-sommation/billet/create']);
  }

  edit(id: number): void {
    this.router.navigate(['/lettres-sommation/billet/edit', id]);
  }

  delete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: 'Êtes-vous sûr de vouloir supprimer cette lettre de sommation ?',
        confirmButtonText: 'Supprimer',
        confirmButtonClass: 'bg-red-600 text-white'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.lettreSommationBilletService.deleteLettreSommationBillet(id)
          .subscribe({
            next: () => {
             // this.toastr.success('Lettre de sommation supprimée avec succès', 'Succès');
              this.loadLettres();
            },
            error: (err) => {
             console.error(err.message || 'Erreur lors de la suppression', 'Erreur');
            }
          });
      }
    });
  }

  toggleSelection(lettre: any): void {
    const index = this.selectedLettres.findIndex(l => l.id === lettre.id);
    if (index > -1) {
      this.selectedLettres.splice(index, 1);
    } else {
      this.selectedLettres.push(lettre);
    }
  }

  isSelected(lettre: any): boolean {
    return this.selectedLettres.some(l => l.id === lettre.id);
  }

  selectAll(): void {
    if (this.selectedLettres.length === this.filteredLettres.length) {
      this.selectedLettres = [];
    } else {
      this.selectedLettres = [...this.filteredLettres];
    }
  }

  updateBulkStatus(): void {
    if (!this.newStatus || this.selectedLettres.length === 0) {
     // this.toastr.warning('Veuillez sélectionner au moins une lettre et un statut', 'Attention');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de modification de statut',
        message: `Êtes-vous sûr de vouloir changer le statut de ${this.selectedLettres.length} lettre(s) à "${this.newStatus}" ?`,
        confirmButtonText: 'Confirmer',
        confirmButtonClass: 'bg-blue-600 text-white'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        const ids = this.selectedLettres.map(l => l.id);
        
        this.lettreSommationBilletService.updateBulkStatus(ids, this.newStatus as string, this.bulkComment)
          .subscribe({
            next: () => {
           //   this.toastr.success(`${this.selectedLettres.length} lettre(s) mise(s) à jour avec succès`, 'Succès');
              this.selectedLettres = [];
              this.newStatus = null;
              this.bulkComment = '';
              this.loadLettres();
            },
            error: (err) => {
              console.error(err.message || 'Erreur lors de la mise à jour', 'Erreur');
            }
          });
      }
    });
  }

  getStatutClass(statut: StatutEnum): string {
    switch (statut) {
      case StatutEnum.NON_TRAITEE:
        return 'bg-gray-500 text-white';
      case StatutEnum.EN_COURS:
        return 'bg-secondary text-white';
      case StatutEnum.URGENT:
        return 'bg-red-500 text-white';
      case StatutEnum.TRAITE:
        return 'bg-indigo-500 text-white';
      case StatutEnum.REGULARISEE:
        return 'bg-green-500 text-white';
      case StatutEnum.NON_REGULARISEE:
        return 'bg-orange-500 text-white';
      case StatutEnum.REJETE:
        return 'bg-gray-800 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
}