import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GareService } from '../../../../services/gare.service';

@Component({
  selector: 'app-gare-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './gare-form.component.html',
  styleUrls: ['./gare-form.component.scss']
})
export class GareFormComponent implements OnInit {
  gareForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error: string | null = null;
  submitAttempted = false;

  constructor(
    private fb: FormBuilder,
    private gareService: GareService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadGare(+id);
    }
  }

  initForm(): void {
    this.gareForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
    });
  }

  loadGare(id: number): void {
    this.loading = true;
    this.gareService.getGareById(id).subscribe({
      next: (gare) => {
        this.gareForm.patchValue({
          nom: gare.nom
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la gare';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.gareForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const gareData = this.gareForm.value;
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.gareService.updateGare(id, gareData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/gares']);
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        }
      });
    } else {
      this.gareService.createGare(gareData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/gares']);
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        }
      });
    }
  }
  
  handleError(err: any): void {
    if (err.error && err.error.message) {
      this.error = err.error.message;
    } else {
      this.error = `Erreur lors de ${this.isEditMode ? 'la mise à jour' : 'la création'} de la gare`;
    }
    console.error(err);
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.gareForm.controls;
  }
}