import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrainService } from '../../../../services/train.service';
import { Train } from '../../../../core/models/train.model';

@Component({
  selector: 'app-train-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './train-list.component.html',
  styleUrls: ['./train-list.component.scss']
})
export class TrainListComponent implements OnInit {
  trains: Train[] = [];
  loading = false;
  error: string | null = null;
  showDeleteModal = false;
  trainToDelete: Train | null = null;
  
  // For filtering
  searchTerm: string = '';

  constructor(private trainService: TrainService) {}

  ngOnInit(): void {
    this.loadTrains();
  }

  loadTrains(): void {
    this.loading = true;
    this.trainService.getAllTrains().subscribe({
      next: (data: Train[]) => {
        this.trains = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des trains';
        this.loading = false;
        console.error(err);
      }
    });
  }

  get filteredTrains(): Train[] {
    if (!this.searchTerm) {
      return this.trains;
    }
    
    const term = this.searchTerm.toLowerCase();
    return this.trains.filter(train => 
      train.numero.toLowerCase().includes(term)
    );
  }

  confirmDelete(train: Train): void {
    this.trainToDelete = train;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.trainToDelete = null;
  }

  deleteTrain(): void {
    if (!this.trainToDelete) return;
    
    this.loading = true;
    this.trainService.deleteTrain(this.trainToDelete.id).subscribe({
      next: () => {
        this.loadTrains();
        this.showDeleteModal = false;
        this.trainToDelete = null;
      },
      error: (err: any) => {
        this.error = 'Erreur lors de la suppression du train';
        this.loading = false;
        console.error(err);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
  }
}