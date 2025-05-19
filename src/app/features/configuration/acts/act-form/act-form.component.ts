// src/app/features/configuration/acts/act-form/act-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActService } from '../../../../services/act.service';
import { AntenneService } from '../../../../services/antenne.service';
import { Antenne } from '../../../../core/models/antenne.model';

@Component({
  selector: 'app-act-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './act-form.component.html',
  styleUrls: ['./act-form.component.scss']
})
export class ActFormComponent implements OnInit {
  actForm!: FormGroup;
  isEditMode = false;
  loading = false;
  loadingAntennes = false;
  error: string | null = null;
  submitAttempted = false;
  antennes: Antenne[] = [];
  
  constructor(
    private fb: FormBuilder,
    private actService: ActService,
    private antenneService: AntenneService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAntennes();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.loadAct(+id);
    }
  }

  initForm(): void {
    this.actForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.maxLength(50)]],
      nomPrenom: ['', [Validators.required, Validators.maxLength(100)]],
      antenneId: [null, [Validators.required]]
    });
  }

  loadAntennes(): void {
    this.loadingAntennes = true;
    this.antenneService.getAllAntennes().subscribe({
      next: (data) => {
        this.antennes = data;
        this.loadingAntennes = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des antennes';
        this.loadingAntennes = false;
        console.error(err);
      }
    });
  }

  loadAct(id: number): void {
    this.loading = true;
    this.actService.getActById(id).subscribe({
      next: (act) => {
        this.actForm.patchValue({
          matricule: act.matricule,
          nomPrenom: act.nomPrenom,
          antenneId: act.antenne.id
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'ACT';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.actForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.actService.updateAct(id, this.actForm.value).subscribe({
        next: () => {
          this.router.navigate(['/configuration/agents']);
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        }
      });
    } else {
      this.actService.createAct(this.actForm.value).subscribe({
        next: () => {
          this.router.navigate(['/configuration/agents']);
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
      this.error = `Erreur lors de ${this.isEditMode ? 'la mise à jour' : 'la création'} de l'ACT`;
    }
    console.error(err);
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.actForm.controls;
  }
}