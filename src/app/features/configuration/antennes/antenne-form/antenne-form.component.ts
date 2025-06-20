import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Section } from '../../../../core/models/section.model';
import { AntenneService } from '../../../../services/antenne.service';
import { SectionService } from '../../../../services/section.service';

@Component({
  selector: 'app-antenne-form',
  templateUrl: './antenne-form.component.html',
  styleUrls: ['./antenne-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true
})
export class AntenneFormComponent implements OnInit {
  antenneForm!: FormGroup;
  isEditMode = false;
  loading = false;
  loadingSections = false;
  error: string | null = null;
  submitAttempted = false;
  sections: Section[] = [];
  
  constructor(
    private fb: FormBuilder,
    private antenneService: AntenneService,
    private sectionService: SectionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSections();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadAntenne(+id);
    }
  }

  initForm(): void {
    this.antenneForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      sectionId: [null, Validators.required]
    });
  }

  loadSections(): void {
    this.loadingSections = true;
    this.sectionService.getAllSections().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.loadingSections = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des sections.';
        this.loadingSections = false;
        console.error(err);
      }
    });
  }

  loadAntenne(id: number): void {
    this.loading = true;
    this.antenneService.getAntenneById(id).subscribe({
      next: (antenne) => {
        this.antenneForm.patchValue({
          nom: antenne.nom,
          sectionId: antenne.section?.id
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'antenne.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.antenneForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const antenneData = this.antenneForm.value;
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.antenneService.updateAntenne(id, antenneData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/antennes']);
        },
        error: (err) => {
          this.error = 'Erreur lors de la mise à jour de l\'antenne.';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      this.antenneService.createAntenne(antenneData).subscribe({
        next: () => {
          this.router.navigate(['/configuration/antennes']);
        },
        error: (err) => {
          this.error = 'Erreur lors de la création de l\'antenne.';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }
  
  get f() {
    return this.antenneForm.controls;
  }
}