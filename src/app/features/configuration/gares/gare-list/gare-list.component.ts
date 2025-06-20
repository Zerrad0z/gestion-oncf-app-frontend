import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GareService } from '../../../../services/gare.service';
import { Gare } from '../../../../core/models/gare.model';

@Component({
  selector: 'app-gare-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './gare-list.component.html',
  styleUrls: ['./gare-list.component.scss']
})
export class GareListComponent implements OnInit {
  gares: Gare[] = [];
  loading = false;
  error: string | null = null;
  showDeleteModal = false;
  gareToDelete: Gare | null = null;
  
  // For filtering
  searchTerm: string = '';

  constructor(private gareService: GareService) {}

  ngOnInit(): void {
    this.loadGares();
  }

  loadGares(): void {
    this.loading = true;
    this.gareService.getAllGares().subscribe({
      next: (data: Gare[]) => {
        this.gares = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des gares';
        this.loading = false;
        console.error(err);
      }
    });
  }

  get filteredGares(): Gare[] {
    if (!this.searchTerm) {
      return this.gares;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.gares.filter(gare => 
      gare.nom.toLowerCase().includes(term)
    );
  }

  confirmDelete(gare: Gare): void {
    this.gareToDelete = gare;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.gareToDelete = null;
  }

  deleteGare(): void {
    if (!this.gareToDelete) return;
    
    this.loading = true;
    this.gareService.deleteGare(this.gareToDelete.id).subscribe({
      next: () => {
        this.loadGares();
        this.showDeleteModal = false;
        this.gareToDelete = null;
      },
      error: (err: any) => {
        this.error = 'Erreur lors de la suppression de la gare';
        this.loading = false;
        console.error(err);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
  }
}