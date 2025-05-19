// src/app/features/configuration/acts/act-list/act-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActService } from '../../../../services/act.service';
import { ACT } from '../../../../core/models/act.model';

@Component({
  selector: 'app-act-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './act-list.component.html',
  styleUrls: ['./act-list.component.scss']
})
export class ActListComponent implements OnInit {
  acts: ACT[] = [];
  loading = true;
  error: string | null = null;
  
  constructor(private actService: ActService) {}
  
  ngOnInit(): void {
    this.loadActs();
  }
  
  loadActs(): void {
    this.loading = true;
    this.actService.getAllActs().subscribe({
      next: (data) => {
        this.acts = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des ACTs';
        this.loading = false;
        console.error(err);
      }
    });
  }
  
  deleteAct(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ACT ?')) {
      this.actService.deleteAct(id).subscribe({
        next: () => {
          this.acts = this.acts.filter(act => act.id !== id);
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression de l\'ACT';
          console.error(err);
        }
      });
    }
  }
}