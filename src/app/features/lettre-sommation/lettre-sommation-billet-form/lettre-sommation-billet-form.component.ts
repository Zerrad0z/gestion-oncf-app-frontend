import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Observable, of, Subject, debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs';
import { ActService } from '../../../services/act.service';
import { GareService } from '../../../services/gare.service';
import { TrainService } from '../../../services/train.service';
import { LettreSommationBilletService } from '../../../services/LettreSommationBillet.service';

enum StatutEnum {
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON REGULARISEE',
}

@Component({
  selector: 'app-lettre-sommation-billet-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './lettre-sommation-billet-form.component.html',
  styleUrls: ['./lettre-sommation-billet-form.component.scss']
})
export class LettreSommationBilletFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  lettreId?: number;
  loading = false;
  submitting = false;
  
  // Typeahead Search
  actSearching = false;
  actSearchFailed = false;
  actSearch$ = new Subject<string>();
  
  gareSearching = false;
  gareSearchFailed = false;
  gareSearch$ = new Subject<string>();
  
  trainSearching = false;
  trainSearchFailed = false;
  trainSearch$ = new Subject<string>();
  
  // Dropdown data
  statuts = [StatutEnum.REGULARISEE, StatutEnum.NON_REGULARISEE]; // Only show these two options
  gammesTrains = ['TNR', 'TL', 'TGV'];
  
  // Since gamme is not a property of Train, we'll use this constant for mapping
  // Later, we can replace this with an API call if it becomes available
  trainGammeMapping: { [key: string]: string } = {
    'TNR1001': 'TNR',
    'TNR1002': 'TNR',
    'TNR1003': 'TNR',
    'TL2001': 'TL',
    'TL2002': 'TL',
    'TL2003': 'TL',
    'TGV3001': 'TGV',
    'TGV3002': 'TGV',
    'TGV3003': 'TGV'
  };
  
  // Filtered options
  filteredActs: any[] = [];
  filteredGares: any[] = [];
  filteredTrains: any[] = [];
  
  // File Upload
  selectedFiles: File[] = [];
  maxFileSize = 5 * 1024 * 1024; // 5MB
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private actService: ActService,
    private gareService: GareService,
    private trainService: TrainService,
    private lettreSommationBilletService: LettreSommationBilletService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.lettreId = +id;
        this.isEditMode = true;
        this.loadLettreSommationBillet(this.lettreId);
      }
    });
    
    // Setup typeahead search observables
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
        id: [null, Validators.required],
        numero: ['', Validators.required],
        gamme: ['', Validators.required] // We'll manage this field manually
      }),
      gare: this.fb.group({
        id: [null, Validators.required],
        nom: ['', Validators.required]
      }),
      dateCreation: [new Date().toISOString().split('T')[0], Validators.required],
      dateInfraction: [new Date().toISOString().split('T')[0], Validators.required],
      statut: [StatutEnum.NON_REGULARISEE, Validators.required],
      montantAmende: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      motifInfraction: ['', Validators.required],
      numeroBillet: ['', Validators.required],
      commentaires: [''],
      // Regularization fields
      dateRegularisation: [''],
      numeroPiecePaiement: ['']
    });
    
    // Add listener for status changes to handle regularization fields
    this.form.get('statut')?.valueChanges.subscribe(value => {
      if (value === 'REGULARISEE') {
        this.form.get('dateRegularisation')?.setValidators([Validators.required]);
        this.form.get('numeroPiecePaiement')?.setValidators([Validators.required]);
      } else {
        this.form.get('dateRegularisation')?.clearValidators();
        this.form.get('numeroPiecePaiement')?.clearValidators();
        this.form.get('dateRegularisation')?.setValue('');
        this.form.get('numeroPiecePaiement')?.setValue('');
      }
      this.form.get('dateRegularisation')?.updateValueAndValidity();
      this.form.get('numeroPiecePaiement')?.updateValueAndValidity();
    });
  }

  loadLettreSommationBillet(id: number): void {
    this.loading = true;
    this.lettreSommationBilletService.getLettreSommationBilletById(id).subscribe({
      next: (lettre) => {
        // Determine the gamme based on the train number pattern or mapping
        const trainGamme = this.getTrainGamme(lettre.train.numero);
        
        this.form.patchValue({
          act: {
            id: lettre.act.id,
            matricule: lettre.act.matricule,
            nomPrenom: lettre.act.nomPrenom,
            antenne: lettre.act.antenne
          },
          train: {
            id: lettre.train.id,
            numero: lettre.train.numero,
            gamme: trainGamme
          },
          gare: {
            id: lettre.gare.id,
            nom: lettre.gare.nom
          },
          dateCreation: lettre.dateCreation.split('T')[0],
          dateInfraction: lettre.dateInfraction.split('T')[0],
          statut: lettre.statut,
          montantAmende: lettre.montantAmende,
          motifInfraction: lettre.motifInfraction,
          numeroBillet: lettre.numeroBillet,
          commentaires: lettre.commentaires
        });
        
        // Set regularization fields if status is REGULARISEE
        if (lettre.statut === 'REGULARISEE' && lettre.dateTraitement) {
          this.form.patchValue({
            dateRegularisation: lettre.dateTraitement.split('T')[0],
            numeroPiecePaiement: lettre.commentaires ? this.extractPieceNumber(lettre.commentaires) : ''
          });
        }
        
        this.loading = false;
      },
      error: (error) => {
        alert('Erreur lors du chargement de la lettre de sommation');
        this.loading = false;
        console.error(error);
      }
    });
  }

  // Helper method to extract piece number from comments (if available)
  extractPieceNumber(comments: string): string {
    const match = comments.match(/N° de PP:?\s*([A-Za-z0-9-]+)/i);
    return match ? match[1] : '';
  }

  // Helper method to determine train gamme based on train number or mapping
  getTrainGamme(trainNumero: string): string {
    // First check our mapping
    if (this.trainGammeMapping[trainNumero]) {
      return this.trainGammeMapping[trainNumero];
    }
    
    // Or determine by pattern (prefix)
    if (trainNumero?.startsWith('TNR')) {
      return 'TNR';
    } else if (trainNumero?.startsWith('TL')) {
      return 'TL';
    } else if (trainNumero?.startsWith('TGV')) {
      return 'TGV';
    }
    
    // Default
    return '';
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

    // Gare typeahead search
    this.gareSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([]);
        this.gareSearching = true;
        
        return this.gareService.getAllGares().pipe(
          map(gares => gares.filter(gare => 
            gare.nom.toLowerCase().includes(term.toLowerCase())
          )),
          catchError(() => {
            this.gareSearchFailed = true;
            return of([]);
          })
        );
      })
    ).subscribe(gares => {
      this.filteredGares = gares;
      this.gareSearching = false;
    });

    // Train typeahead search
    this.trainSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([]);
        this.trainSearching = true;
        
        return this.trainService.getAllTrains().pipe(
          map(trains => {
            // Filter by train number
            const filteredByNumber = trains.filter(train => 
              train.numero.toLowerCase().includes(term.toLowerCase())
            );
            
            // If we have a gamme selected, further filter by gamme pattern
            const selectedGamme = this.form.get('train.gamme')?.value;
            if (selectedGamme) {
              return filteredByNumber.filter(train => 
                this.getTrainGamme(train.numero) === selectedGamme
              );
            }
            
            return filteredByNumber;
          }),
          catchError(() => {
            this.trainSearchFailed = true;
            return of([]);
          })
        );
      })
    ).subscribe(trains => {
      this.filteredTrains = trains;
      this.trainSearching = false;
    });
  }

  /* ACT Handling */
  onActInput(event: any): void {
    const value = event.target.value;
    console.log('ACT input value:', value); // Debug log
    
    if (value && value.length >= 3) {
      // For matricule pattern (numbers only), immediately try to fetch the exact ACT
      if (/^\d+$/.test(value)) {
        this.actSearching = true;
        console.log('Searching for ACT by matricule:', value); // Debug log
        
        this.actService.getActByMatricule(value).subscribe({
          next: (act) => {
            console.log('ACT found:', act); // Debug log
            
            if (act) {
              // Auto-populate all ACT fields
              this.form.patchValue({
                act: {
                  id: act.id,
                  matricule: act.matricule,
                  nomPrenom: act.nomPrenom,
                  antenne: act.antenne
                }
              });
              this.actSearching = false;
              this.filteredActs = []; // Clear dropdown since we found what we want
            }
          },
          error: (err) => {
            console.error('Error fetching ACT:', err); // Debug log
            this.actSearchFailed = true;
            this.actSearching = false;
            // Continue with regular search
            this.actSearch$.next(value);
          }
        });
      } else {
        // Standard search for text input
        this.actSearch$.next(value);
      }
    }
  }
  
  onActSelect(act: any): void {
    console.log('ACT selected:', act); // Debug log
    
    this.form.patchValue({
      act: {
        id: act.id,
        matricule: act.matricule,
        nomPrenom: act.nomPrenom,
        antenne: act.antenne
      }
    });
    this.filteredActs = []; // Clear dropdown after selection
  }

  /* Train Handling */
  onTrainGammeChange(event: any): void {
    const gamme = event.target.value;
    console.log('Train gamme changed:', gamme); // Debug log
    
    // Reset train selection
    this.form.patchValue({
      train: {
        ...this.form.value.train,
        id: null,
        numero: '',
        gamme: gamme
      }
    });
    
    // Load all trains and filter by the selected gamme
    this.trainService.getAllTrains().subscribe(trains => {
      this.filteredTrains = trains.filter(train => 
        this.getTrainGamme(train.numero) === gamme
      );
      console.log('Filtered trains by gamme:', this.filteredTrains); // Debug log
    });
  }
  
  onTrainInput(event: any): void {
    const value = event.target.value;
    if (value && value.length >= 2) {
      this.trainSearch$.next(value);
    }
  }
  
  onTrainSelect(train: any): void {
    console.log('Train selected:', train); // Debug log
    
    // When a train is selected, determine its gamme
    const gamme = this.getTrainGamme(train.numero);
    
    this.form.patchValue({
      train: {
        id: train.id,
        numero: train.numero,
        gamme: gamme
      }
    });
    this.filteredTrains = []; // Clear dropdown after selection
  }

  /* Gare Handling */
  onGareInput(event: any): void {
    const value = event.target.value;
    if (value && value.length >= 2) {
      this.gareSearch$.next(value);
    }
  }
  
  onGareSelect(gare: any): void {
    console.log('Gare selected:', gare); // Debug log
    
    this.form.patchValue({
      gare: {
        id: gare.id,
        nom: gare.nom
      }
    });
    this.filteredGares = []; // Clear dropdown after selection
  }

  /* File Handling */
  onFileSelected(event: any): void {
    const files = event.target.files;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
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
    // Log form state for debugging
    console.log('Form submitted, valid:', this.form.valid);
    console.log('Form values:', this.form.value);
    console.log('Form errors:', this.getFormValidationErrors());
    
    if (this.form.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      this.markFormGroupTouched(this.form);
      return;
    }
    
    this.submitting = true;
    
    const formData = new FormData();
    const lettreBillet = {
      actId: this.form.value.act.id,
      trainId: this.form.value.train.id,
      gareId: this.form.value.gare.id,
      dateCreation: this.form.value.dateCreation,
      dateInfraction: this.form.value.dateInfraction,
      statut: this.form.value.statut,
      montantAmende: this.form.value.montantAmende,
      motifInfraction: this.form.value.motifInfraction,
      numeroBillet: this.form.value.numeroBillet,
      commentaires: this.form.value.commentaires
    };
    
    // Add regularization info to comments if applicable
    if (this.form.value.statut === 'REGULARISEE') {
      const pieceInfo = this.form.value.numeroPiecePaiement 
        ? `N° de PP: ${this.form.value.numeroPiecePaiement}` 
        : '';
        
      const dateInfo = this.form.value.dateRegularisation 
        ? `Date de régularisation: ${this.form.value.dateRegularisation}` 
        : '';
        
      const regularisationInfo = [pieceInfo, dateInfo].filter(Boolean).join('\n');
      
      lettreBillet.commentaires = lettreBillet.commentaires 
        ? `${lettreBillet.commentaires}\n\n${regularisationInfo}` 
        : regularisationInfo;
    }
    
    // Add the lettre data as a JSON string
    formData.append('lettre', new Blob([JSON.stringify(lettreBillet)], {
      type: 'application/json'
    }));
    
    // Add files
    for (const file of this.selectedFiles) {
      formData.append('fichiers', file);
    }
    
    if (this.isEditMode && this.lettreId) {
      this.lettreSommationBilletService.updateLettreSommationBillet(this.lettreId, formData).subscribe({
        next: () => {
          alert('Lettre de sommation mise à jour avec succès');
          this.submitting = false;
          this.router.navigate(['/lettres-sommation/billet']);
        },
        error: (error) => {
          alert('Erreur lors de la mise à jour de la lettre de sommation');
          this.submitting = false;
          console.error(error);
        }
      });
    } else {
      this.lettreSommationBilletService.createLettreSommationBillet(formData).subscribe({
        next: () => {
          alert('Lettre de sommation créée avec succès');
          this.submitting = false;
          this.router.navigate(['/lettres-sommation/billet']);
        },
        error: (error) => {
          alert('Erreur lors de la création de la lettre de sommation');
          this.submitting = false;
          console.error(error);
        }
      });
    }
  }

  // Debug helper: Get all validation errors
  getFormValidationErrors() {
    const errors: any = {};
    
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
      
      if (key === 'act' || key === 'train' || key === 'gare') {
        const group = this.form.get(key) as FormGroup;
        Object.keys(group.controls).forEach(subKey => {
          const subControl = group.get(subKey);
          if (subControl?.errors) {
            errors[`${key}.${subKey}`] = subControl.errors;
          }
        });
      }
    });
    
    return errors;
  }

  cancel(): void {
    this.router.navigate(['/lettres-sommation/billet']);
  }

  // Helper method to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}