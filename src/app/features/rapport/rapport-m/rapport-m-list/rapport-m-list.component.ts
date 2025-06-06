import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RapportMService } from '../../../../services/rapport-m.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategorieRapportEnum } from '../../../../core/models/CategorieRapportEnum.model';

@Component({
  selector: 'app-rapport-m-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatDialogModule
  ],
  templateUrl: './rapport-m-list.component.html',
  styleUrls: ['./rapport-m-list.component.scss']
})
export class RapportMListComponent implements OnInit {
  rapports: any[] = [];
  filteredRapports: any[] = [];
  loading = false;
  error = '';
  
  // Pagination
  page = 0;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtering
  searchTerm = '';
  filterCategorie: CategorieRapportEnum | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  
  // Bulk actions
  selectedRapports: any[] = [];
  bulkComment = '';
  
  // Enums for template
  categories = Object.values(CategorieRapportEnum);

  constructor(
    private rapportMService: RapportMService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRapports();
  }

  loadRapports(): void {
  this.loading = true;
  this.rapportMService.getAllRapportsM()
    .subscribe({
      next: (data) => {
        // ✅ DETAILED DEBUG LOGGING
        console.log('=== DETAILED LIST DEBUG ===');
        console.log('Raw response:', data);
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        console.log('Array length:', data?.length);
        
        if (data && data.length > 0) {
          const firstItem = data[0];
          console.log('First item full object:', firstItem);
          console.log('Available properties:', Object.keys(firstItem));
          
          // Check specific fields
          console.log('references:', firstItem.references);
          console.log('objet:', firstItem.objet);
          console.log('dateEnvoi:', firstItem.dateEnvoi);
          console.log('train:', firstItem.train);
          console.log('act:', firstItem.act);
        }
        
        this.rapports = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('=== ERROR LOADING RAPPORTS ===', err);
        this.error = err.message || 'Erreur lors du chargement des rapports M.';
        this.loading = false;
      }
    });
}

  applyFilters(): void {
    let result = this.rapports;

    // Apply text search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(rapport => 
        rapport.references?.toLowerCase().includes(term) ||
        rapport.objet?.toLowerCase().includes(term) ||
        rapport.detail?.toLowerCase().includes(term) ||
        rapport.act?.nomPrenom?.toLowerCase().includes(term) ||
        rapport.act?.matricule?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (this.filterCategorie) {
      result = result.filter(rapport => rapport.categorie === this.filterCategorie);
    }

    // Apply date range filter
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      result = result.filter(rapport => {
        const date = new Date(rapport.dateEnvoi);
        return date >= start && date <= end;
      });
    }

    this.filteredRapports = result;
    this.totalItems = result.length;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterCategorie = null;
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

  get paginatedRapports(): any[] {
    const startIndex = this.page * this.pageSize;
    return this.filteredRapports.slice(startIndex, startIndex + this.pageSize);
  }

  viewDetails(id: number): void {
    this.router.navigate(['/rapport/rapport-m', id]);
  }

  createNew(): void {
    this.router.navigate(['/rapport/rapport-m/create']);
  }

  edit(id: number): void {
    this.router.navigate(['/rapport/rapport-m/edit', id]);
  }

  delete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: 'Êtes-vous sûr de vouloir supprimer ce rapport M ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rapportMService.deleteRapportM(id)
          .subscribe({
            next: () => {
              alert('Rapport M supprimé avec succès');
              this.loadRapports();
            },
            error: (err) => {
              console.error('Erreur lors de la suppression:', err.message);
              alert('Erreur lors de la suppression du rapport M');
            }
          });
      }
    });
  }

  toggleSelection(rapport: any): void {
    const index = this.selectedRapports.findIndex(r => r.id === rapport.id);
    if (index > -1) {
      this.selectedRapports.splice(index, 1);
    } else {
      this.selectedRapports.push(rapport);
    }
  }

  isSelected(rapport: any): boolean {
    return this.selectedRapports.some(r => r.id === rapport.id);
  }

  selectAll(): void {
    if (this.selectedRapports.length === this.filteredRapports.length) {
      this.selectedRapports = [];
    } else {
      this.selectedRapports = [...this.filteredRapports];
    }
  }

  updateBulk(): void {
    if (this.selectedRapports.length === 0) {
      alert('Veuillez sélectionner au moins un rapport');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de modification',
        message: `Êtes-vous sûr de vouloir modifier ${this.selectedRapports.length} rapport(s) ?`,
        confirmText: 'Confirmer',
        cancelText: 'Annuler'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const ids = this.selectedRapports.map(r => r.id);
        const request = {
          ids: ids,
          newStatus: 'UPDATED', // You may need to adjust this based on your requirements
          commentaire: this.bulkComment
        };
        
        this.rapportMService.updateBulkStatus(request)
          .subscribe({
            next: () => {
              alert(`${this.selectedRapports.length} rapport(s) mis à jour avec succès`);
              this.selectedRapports = [];
              this.bulkComment = '';
              this.loadRapports();
            },
            error: (err) => {
              console.error('Erreur lors de la mise à jour:', err.message);
              alert('Erreur lors de la mise à jour des rapports');
            }
          });
      }
    });
  }

  getCategorieClass(categorie: CategorieRapportEnum): string {
    switch (categorie) {
      case CategorieRapportEnum.EPAVES:
        return 'bg-yellow-100 text-yellow-800';
      case CategorieRapportEnum.COMPTABILITE:
        return 'bg-green-100 text-green-800';
      case CategorieRapportEnum.BILLETS:
        return 'bg-blue-100 text-blue-800';
      case CategorieRapportEnum.DIVERS:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}