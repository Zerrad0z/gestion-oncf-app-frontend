import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SectionService } from '../../../../services/section.service';
import { PermissionService } from '../../../../services/permission.service';

@Component({
  selector: 'app-section-form',
  templateUrl: './section-form.component.html',
  styleUrls: ['./section-form.component.scss'],
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
    private route: ActivatedRoute,
    private permissionService: PermissionService  // Add this
  ) {}

  ngOnInit(): void {
    // Check permissions before initializing
    if (this.isEditMode && !this.permissionService.canEditSection()) {
      this.error = this.permissionService.getAccessDeniedMessage('edit');
      return;
    }
    
    if (!this.isEditMode && !this.permissionService.canCreateSection()) {
      this.error = this.permissionService.getAccessDeniedMessage('create-section');
      return;
    }

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
    if (!this.permissionService.canEditSection()) {
      this.error = this.permissionService.getAccessDeniedMessage('edit');
      return;
    }

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
        console.error('Load section error:', err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.sectionForm.invalid) {
      return;
    }

    // Double-check permissions before submitting
    if (this.isEditMode && !this.permissionService.canEditSection()) {
      this.error = this.permissionService.getAccessDeniedMessage('edit');
      return;
    }
    
    if (!this.isEditMode && !this.permissionService.canCreateSection()) {
      this.error = this.permissionService.getAccessDeniedMessage('create-section');
      return;
    }
    
    this.loading = true;
    this.error = null; // Clear previous errors
    
    const sectionData = this.sectionForm.value;
    console.log('Sending section data:', sectionData);
    console.log('User role:', this.permissionService.getUserRole());
    console.log('Can create section:', this.permissionService.canCreateSection());
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.sectionService.updateSection(id, sectionData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/sections']);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.handleError(err);
          this.loading = false;
        }
      });
    } else {
      this.sectionService.createSection(sectionData).subscribe({
        next: (response) => {
          console.log('Section created successfully:', response);
          this.router.navigate(['/configuration/sections']);
        },
        error: (err) => {
          console.error('Create error:', err);
          this.handleError(err);
          this.loading = false;
        }
      });
    }
  }

  private handleError(err: any): void {
    if (err.status === 0) {
      this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    } else if (err.status === 400) {
      this.error = err.error?.message || 'Données invalides.';
    } else if (err.status === 401) {
      this.error = 'Non autorisé. Veuillez vous reconnecter.';
    } else if (err.status === 403) {
      this.error = 'Accès interdit. Vous n\'avez pas les droits nécessaires.';
    } else if (err.status === 409) {
      this.error = 'Une section avec ce nom existe déjà.';
    } else if (err.status === 500) {
      this.error = 'Erreur du serveur. Veuillez réessayer plus tard.';
    } else {
      this.error = `Erreur lors de la ${this.isEditMode ? 'mise à jour' : 'création'} de la section.`;
    }
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.sectionForm.controls;
  }
}