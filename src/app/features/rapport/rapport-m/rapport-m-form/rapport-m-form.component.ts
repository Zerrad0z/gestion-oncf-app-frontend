import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subject, debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs';
import { ActService } from '../../../../services/act.service';
import { TrainService } from '../../../../services/train.service';
import { RapportMService } from '../../../../services/rapport-m.service';
import { CategorieRapportEnum } from '../../../../core/models/CategorieRapportEnum.model';

@Component({
  selector: 'app-rapport-m-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './rapport-m-form.component.html',
  styleUrls: ['./rapport-m-form.component.scss']
})
export class RapportMFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  rapportId?: number;
  loading = false;
  submitting = false;
  
  // Typeahead Search - ACT only
  actSearching = false;
  actSearchFailed = false;
  actSearch$ = new Subject<string>();
  
  // Train dropdown
  trainLoading = false;
  allTrains: any[] = [];
  
  // Dropdown data
  categories = Object.values(CategorieRapportEnum);
  gammesTrains = ['TNR', 'TL', 'TGV']; // Independent field, not related to actual trains
  
  // Filtered options
  filteredActs: any[] = [];
  
  // File Upload
  selectedFiles: File[] = [];
  maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private actService: ActService,
    private trainService: TrainService,
    private rapportMService: RapportMService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllTrains(); // Load trains on component init
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.rapportId = +id;
        this.isEditMode = true;
        this.loadRapportM(this.rapportId);
      }
    });
    
    // Setup typeahead search observables (only ACT)
    this.setupTypeaheadSearch();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      act: this.fb.group({
        id: [null, Validators.required],
        matricule: ['', Validators.required],
        nomPrenom: ['', Validators.required],
        antenne: [null]
      }),
      train: this.fb.group({
        id: [null, Validators.required], // This is the main field we need
        numero: [''], // Display only, will be set automatically
        gamme: [''] // Independent field, not related to selected train
      }),
      references: ['', Validators.required],
      dateEnvoi: [new Date().toISOString().split('T')[0], Validators.required],
      dateReception: [''],
      objet: ['', Validators.required],
      categorie: ['', Validators.required],
      detail: ['', Validators.required],
      dateTrain: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadRapportM(id: number): void {
    this.loading = true;
    this.rapportMService.getRapportMById(id).subscribe({
      next: (rapport) => {
        this.form.patchValue({
          act: {
            id: rapport.act.id,
            matricule: rapport.act.matricule,
            nomPrenom: rapport.act.nomPrenom,
            antenne: rapport.act.antenne
          },
          train: {
            id: rapport.train.id,
            numero: rapport.train.numero,
            gamme: '' // Independent field, will be set independently by user if needed
          },
          references: rapport.references,
          dateEnvoi: rapport.dateEnvoi,
          dateReception: rapport.dateReception,
          objet: rapport.objet,
          categorie: rapport.categorie,
          detail: rapport.detail,
          dateTrain: rapport.dateTrain
        });
        
        this.loading = false;
      },
      error: (error) => {
        alert('Erreur lors du chargement du rapport M');
        this.loading = false;
        console.error(error);
      }
    });
  }

  // Load all trains for dropdown
  loadAllTrains(): void {
    this.trainLoading = true;
    this.trainService.getAllTrains().subscribe({
      next: (trains) => {
        this.allTrains = trains;
        this.trainLoading = false;
        console.log('All trains loaded:', trains);
      },
      error: (err) => {
        console.error('Error loading trains:', err);
        this.trainLoading = false;
      }
    });
  }

  // Handle train dropdown selection
  onTrainDropdownSelect(event: any): void {
    const trainId = +event.target.value;
    console.log('Train selected from dropdown, ID:', trainId);
    
    if (trainId) {
      const selectedTrain = this.allTrains.find(train => train.id === trainId);
      
      if (selectedTrain) {
        console.log('Selected train:', selectedTrain);
        
        // Set train form values (gamme is independent, so keep existing value)
        this.form.patchValue({
          train: {
            id: selectedTrain.id,
            numero: selectedTrain.numero,
            gamme: this.form.get('train.gamme')?.value || '' // Keep existing gamme value
          }
        });
        
        console.log('Train form after selection:', this.form.get('train')?.value);
      }
    } else {
      // Clear train selection but keep gamme
      this.form.patchValue({
        train: {
          id: null,
          numero: '',
          gamme: this.form.get('train.gamme')?.value || '' // Keep existing gamme value
        }
      });
    }
  }

  setupTypeaheadSearch(): void {
    // ACT search
    this.actSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return of([]);
        this.actSearching = true;
        
        // Try to get exact match by matricule first
        if (/^\d+$/.test(term)) {
          return this.actService.getActByMatricule(term).pipe(
            map(act => [act]),
            catchError(() => {
              // If not found by matricule, get all ACTs and filter
              return this.actService.getAllActs().pipe(
                map(acts => acts.filter(act => 
                  act.matricule.includes(term) || 
                  act.nomPrenom.toLowerCase().includes(term.toLowerCase())
                )),
                catchError(() => {
                  this.actSearchFailed = true;
                  return of([]);
                })
              );
            })
          );
        } else {
          // Search by name
          return this.actService.getAllActs().pipe(
            map(acts => acts.filter(act => 
              act.nomPrenom.toLowerCase().includes(term.toLowerCase())
            )),
            catchError(() => {
              this.actSearchFailed = true;
              return of([]);
            })
          );
        }
      })
    ).subscribe(acts => {
      this.filteredActs = acts;
      this.actSearching = false;
    });
  }

  /* ACT Handling */
  onActInput(event: any): void {
    const value = event.target.value;
    console.log('ACT input value:', value);
    
    if (value && value.length >= 3) {
      this.actSearching = true;
      this.actSearchFailed = false;
      
      console.log('Searching for ACT by matricule:', value);
      
      this.actService.getActByMatricule(value).subscribe({
        next: (act) => {
          console.log('ACT found:', act);
          
          if (act) {
            this.form.patchValue({
              act: {
                id: act.id,
                matricule: act.matricule,
                nomPrenom: act.nomPrenom,
                antenne: act.antenne
              }
            });
            this.actSearching = false;
            this.filteredActs = [];
          }
        },
        error: (err) => {
          this.actSearching = false;
          this.actSearchFailed = true;
          
          if (err.status === 404) {
            console.warn(`ACT with matricule ${value} not found in database`);
          } else if (err.status === 0) {
            console.error('Network error - unable to connect to server');
          } else {
            console.error('Error fetching ACT:', err);
          }
          
          this.searchAllActs(value);
          
          setTimeout(() => {
            this.actSearchFailed = false;
          }, 5000);
        }
      });
    } else {
      this.filteredActs = [];
    }
  }

  private searchAllActs(searchTerm: string): void {
    console.log('Falling back to searching all ACTs...');
    
    this.actService.getAllActs().subscribe({
      next: (acts) => {
        this.filteredActs = acts.filter(act => 
          act.matricule.toLowerCase().includes(searchTerm.toLowerCase()) || 
          act.nomPrenom.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        console.log(`Found ${this.filteredActs.length} ACTs matching "${searchTerm}"`);
        
        if (this.filteredActs.length === 0) {
          this.actSearchFailed = true;
          setTimeout(() => {
            this.actSearchFailed = false;
          }, 5000);
        }
      },
      error: (err) => {
        console.error('Error searching all ACTs:', err);
        this.actSearchFailed = true;
        setTimeout(() => {
          this.actSearchFailed = false;
        }, 5000);
      }
    });
  }
  
  onActSelect(act: any): void {
    console.log('ACT selected:', act);
    
    this.form.patchValue({
      act: {
        id: act.id,
        matricule: act.matricule,
        nomPrenom: act.nomPrenom,
        antenne: act.antenne
      }
    });
    this.filteredActs = [];
  }

  /* File Handling */
  onFileSelected(event: any): void {
    const files = event.target.files;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > this.maxFileSize) {
        alert(`Le fichier ${file.name} est trop volumineux. Taille maximale: 5MB`);
        continue;
      }
      
      this.selectedFiles.push(file);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /* Form Submission */
  onSubmit(): void {
    console.log('Form submitted, valid:', this.form.valid);
    console.log('Form values:', this.form.value);
    
    this.markFormGroupTouched(this.form);
    
    if (this.form.invalid) {
      console.error('Form is invalid. Cannot submit.');
      
      const invalidFields = [];
      
      if (this.form.get('act.id')?.invalid) invalidFields.push('Agent ID');
      if (this.form.get('act.matricule')?.invalid) invalidFields.push('Matricule agent');
      if (this.form.get('act.nomPrenom')?.invalid) invalidFields.push('Nom/Prénom agent');
      
      if (this.form.get('train.id')?.invalid) invalidFields.push('Train ID');
      
      if (this.form.get('references')?.invalid) invalidFields.push('Références');
      if (this.form.get('dateEnvoi')?.invalid) invalidFields.push('Date envoi');
      if (this.form.get('objet')?.invalid) invalidFields.push('Objet');
      if (this.form.get('categorie')?.invalid) invalidFields.push('Catégorie');
      if (this.form.get('detail')?.invalid) invalidFields.push('Détail');
      if (this.form.get('dateTrain')?.invalid) invalidFields.push('Date train');
      
      alert(`Veuillez remplir tous les champs obligatoires:\n\n${invalidFields.join('\n')}`);
      return;
    }
    
    this.submitting = true;
    
    const formData = new FormData();
    const rapportData = {
      actId: this.form.value.act.id,
      trainId: this.form.value.train.id,
      references: this.form.value.references,
      dateEnvoi: this.form.value.dateEnvoi,
      dateReception: this.form.value.dateReception,
      objet: this.form.value.objet,
      categorie: this.form.value.categorie,
      detail: this.form.value.detail,
      dateTrain: this.form.value.dateTrain
      // Note: gamme is not sent to backend as it's not part of RapportM model
    };
    
    formData.append('rapport', new Blob([JSON.stringify(rapportData)], {
      type: 'application/json'
    }));
    
    for (const file of this.selectedFiles) {
      formData.append('fichiers', file);
    }
    
    console.log('Submitting form data:', rapportData);
    
    if (this.isEditMode && this.rapportId) {
      this.rapportMService.updateRapportM(this.rapportId, formData).subscribe({
        next: () => {
          alert('Rapport M mis à jour avec succès');
          this.submitting = false;
          this.router.navigate(['/rapport/rapport-m']);
        },
        error: (error) => {
          alert('Erreur lors de la mise à jour du rapport M');
          this.submitting = false;
          console.error(error);
        }
      });
    } else {
      this.rapportMService.createRapportM(formData).subscribe({
        next: () => {
          alert('Rapport M créé avec succès');
          this.submitting = false;
          this.router.navigate(['/rapport/rapport-m']);
        },
        error: (error) => {
          alert('Erreur lors de la création du rapport M');
          this.submitting = false;
          console.error(error);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/rapport/rapport-m']);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}