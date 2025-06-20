import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LettreSommationCarteService } from '../../../services/lettre-sommation-carte.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

enum StatutEnum {
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON_REGULARISEE'
}

@Component({
  selector: 'app-lettre-sommation-carte-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './lettre-sommation-carte-list.component.html',
  styleUrls: ['./lettre-sommation-carte-list.component.scss']
})
export class LettreSommationCarteListComponent implements OnInit {
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
    private lettreSommationCarteService: LettreSommationCarteService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLettres();
  }

  loadLettres(): void {
    this.loading = true;
    this.lettreSommationCarteService.getAllLettresSommationCarte()
      .subscribe({
        next: (data) => {
          this.lettres = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors du chargement des lettres de sommation.';
          this.loading = false;
          console.error(this.error);
        }
      });
  }

  applyFilters(): void {
    let result = this.lettres;

    // Apply text search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(lettre => 
        lettre.numeroCarte?.toLowerCase().includes(term) ||
        lettre.typeCarte?.toLowerCase().includes(term) ||
        lettre.act?.nomPrenom?.toLowerCase().includes(term) ||
        lettre.act?.matricule?.toLowerCase().includes(term) ||
        lettre.gare?.nom?.toLowerCase().includes(term) ||
        lettre.commentaires?.toLowerCase().includes(term)
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
    this.page = 0; 
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
    this.router.navigate(['/lettre-sommation/carte', id]);
  }

  createNew(): void {
    this.router.navigate(['/lettre-sommation/carte/create']);
  }

  edit(id: number): void {
    this.router.navigate(['/lettre-sommation/carte/edit', id]);
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
        this.lettreSommationCarteService.deleteLettreSommationCarte(id)
          .subscribe({
            next: () => {
              console.log('Lettre de sommation supprimée avec succès');
              this.loadLettres();
            },
            error: (err) => {
              console.error(err.message || 'Erreur lors de la suppression');
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
      alert('Veuillez sélectionner au moins une lettre et un statut');
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
        
        this.lettreSommationCarteService.updateBulkStatus(ids, this.newStatus as string, this.bulkComment)
          .subscribe({
            next: () => {
              console.log(`${this.selectedLettres.length} lettre(s) mise(s) à jour avec succès`);
              this.selectedLettres = [];
              this.newStatus = null;
              this.bulkComment = '';
              this.loadLettres();
            },
            error: (err) => {
              console.error(err.message || 'Erreur lors de la mise à jour');
            }
          });
      }
    });
  }

  getStatutClass(statut: StatutEnum): string {
    switch (statut) {
      case StatutEnum.REGULARISEE:
        return 'bg-green-500 text-white';
      case StatutEnum.NON_REGULARISEE:
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
}