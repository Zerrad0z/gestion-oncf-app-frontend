// src/app/features/configuration/trains/train-form/train-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TrainService } from '../../../../services/train.service';

@Component({
  selector: 'app-train-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './train-form.component.html',
  styleUrls: ['./train-form.component.scss']
})
export class TrainFormComponent implements OnInit {
  trainForm!: FormGroup;
  isEditMode = false;
  loading = false;
  error: string | null = null;
  submitAttempted = false;

  constructor(
    private fb: FormBuilder,
    private trainService: TrainService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadTrain(+id);
    }
  }

  initForm(): void {
    this.trainForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]]
    });
  }

  loadTrain(id: number): void {
    this.loading = true;
    this.trainService.getTrainById(id).subscribe({
      next: (train) => {
        this.trainForm.patchValue({
          numero: train.numero
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du train';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.trainForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const trainData = this.trainForm.value;
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.trainService.updateTrain(id, trainData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/trains']);
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        }
      });
    } else {
      this.trainService.createTrain(trainData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/trains']);
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
      this.error = `Erreur lors de ${this.isEditMode ? 'la mise à jour' : 'la création'} du train`;
    }
    console.error(err);
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.trainForm.controls;
  }
}