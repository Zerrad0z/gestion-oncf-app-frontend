// src/app/features/configuration/sections/section-form/section-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SectionService } from '../../../../services/section.service';

@Component({
  selector: 'app-section-form',
  templateUrl: './section-form.component.html',
  styleUrls: ['./section-form.component.scss'],
  // Add these imports for Angular 19
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true
})
export class SectionFormComponent implements OnInit {
  sectionForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error: string | null = null;
  submitAttempted = false;
  
  constructor(
    private fb: FormBuilder,
    private sectionService: SectionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadSection(+id);
    }
  }

  initForm(): void {
    this.sectionForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  loadSection(id: number): void {
    this.loading = true;
    this.sectionService.getSectionById(id).subscribe({
      next: (section) => {
        this.sectionForm.patchValue({
          nom: section.nom
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la section.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.sectionForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const sectionData = this.sectionForm.value;
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.sectionService.updateSection(id, sectionData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/sections']);
        },
        error: (err) => {
          this.error = 'Erreur lors de la mise à jour de la section.';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      this.sectionService.createSection(sectionData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/sections']);
        },
        error: (err) => {
          this.error = 'Erreur lors de la création de la section.';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.sectionForm.controls;
  }
}