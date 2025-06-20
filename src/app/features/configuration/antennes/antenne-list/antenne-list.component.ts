import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AntenneService } from '../../../../services/antenne.service';
import { SectionService } from '../../../../services/section.service';
import { Antenne } from '../../../../core/models/antenne.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-antenne-list',
  templateUrl: './antenne-list.component.html',
  styleUrls: ['./antenne-list.component.scss'],
  imports: [CommonModule, RouterLink, FormsModule],
  standalone: true
})
export class AntenneListComponent implements OnInit {
  antennes: Antenne[] = [];
  sections: Section[] = [];
  loading = false;
  error: string | null = null;
  selectedSectionId: number | null = null;
    showDeleteModal = false;
  antenneToDelete: Antenne | null = null;

  constructor(
    private antenneService: AntenneService,
    private sectionService: SectionService
  ) {}

  ngOnInit(): void {
    this.loadSections();
    this.loadAntennes();
  }

  loadSections(): void {
    this.sectionService.getAllSections().subscribe({
      next: (data: Section[]) => {
        this.sections = data;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des sections';
        console.error(err);
      }
    });
  }

  loadAntennes(): void {
    this.loading = true;
    this.antenneService.getAllAntennes().subscribe({
      next: (data: Antenne[]) => {
        this.antennes = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des antennes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  filterBySection(): void {
    if (!this.selectedSectionId) {
      this.loadAntennes();
      return;
    }
    
    this.loading = true;
    this.antenneService.getAntennesBySection(this.selectedSectionId).subscribe({
      next: (data: Antenne[]) => {
        this.antennes = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du filtrage des antennes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  confirmDelete(antenne: Antenne): void {
    this.antenneToDelete = antenne;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.antenneToDelete = null;
  }

  deleteAntenne(): void {
    if (!this.antenneToDelete) return;
    
    this.loading = true;
    this.antenneService.deleteAntenne(this.antenneToDelete.id).subscribe({
      next: () => {
        this.loadAntennes();
        this.showDeleteModal = false;
        this.antenneToDelete = null;
      },
      error: (err: any) => {
        this.error = 'Erreur lors de la suppression de l\'antenne';
        this.loading = false;
        console.error(err);
      }
    });
  }
}