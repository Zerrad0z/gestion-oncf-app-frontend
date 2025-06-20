import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SectionService } from '../../../../services/section.service';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-section-list',
  templateUrl: './section-list.component.html',
  styleUrls: ['./section-list.component.scss'],
  imports: [CommonModule, RouterLink],
  standalone: true
})
export class SectionListComponent implements OnInit {
  sections: Section[] = [];
  loading = false;
  error: string | null = null;
  showDeleteModal = false;
  sectionToDelete: Section | null = null;

  constructor(private sectionService: SectionService) {}

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    this.loading = true;
    this.sectionService.getAllSections().subscribe({
      next: (data: Section[]) => {
        this.sections = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des sections';
        this.loading = false;
        console.error(err);
      }
    });
  }

  confirmDelete(section: Section): void {
    this.sectionToDelete = section;
    this.showDeleteModal = true;
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.sectionToDelete = null;
  }
  
  deleteSection(): void {
    if (!this.sectionToDelete) return;
    
    this.loading = true;
    this.sectionService.deleteSection(this.sectionToDelete.id).subscribe({
      next: () => {
        this.loadSections();
        this.showDeleteModal = false;
        this.sectionToDelete = null;
      },
      error: (err: any) => {
        this.error = 'Erreur lors de la suppression de la section';
        this.loading = false;
        console.error(err);
      }
    });
  }
}