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
  // Property to toggle validation details visibility
showValidationDetails = false;

// Helper to get error messages for a control
getControlErrors(controlName: string): string {
  const control = this.form.get(controlName);
  if (!control || !control.errors) return '';
  
  const errors: string[] = [];
  
  if (control.errors['required']) {
    errors.push('Required');
  }
  if (control.errors['pattern']) {
    errors.push('Invalid format');
  }
  if (control.errors['min']) {
    errors.push(`Min value: ${control.errors['min'].min}`);
  }
  if (control.errors['max']) {
    errors.push(`Max value: ${control.errors['max'].max}`);
  }
  // Add other validations as needed
  
  return errors.join(', ');
}

// Helper method to check form validity and highlight all invalid fields
validateForm(): void {
  this.markFormGroupTouched(this.form);
  
  // Log all validation issues to console
  console.log('Form valid:', this.form.valid);
  console.log('Form value:', this.form.value);
  console.log('Form errors:', this.getFormValidationErrors());
  
  if (!this.form.valid) {
    this.showValidationDetails = true;
    alert('Le formulaire contient des erreurs. Veuillez les corriger avant de soumettre.');
  }
}

// Optional - add a button to trigger the validation check
checkFormValidity(): void {
  this.validateForm();
  
  // Scroll to top to show validation panel
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
  
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
    this.actSearching = true;
    this.actSearchFailed = false; // Reset error state
    
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
        this.actSearching = false;
        this.actSearchFailed = true;
        
        if (err.status === 404) {
          console.warn(`ACT with matricule ${value} not found in database`);
          // For 404, we might want to show a specific message
          // or continue with searching through all acts
        } else if (err.status === 0) {
          console.error('Network error - unable to connect to server');
        } else {
          console.error('Error fetching ACT:', err);
        }
        
        // Fall back to searching through all acts if the direct lookup fails
        this.searchAllActs(value);
        
        // Clear error after a delay
        setTimeout(() => {
          this.actSearchFailed = false;
        }, 5000);
      }
    });
  } else {
    // Clear results if input is too short
    this.filteredActs = [];
  }
}

// Helper method to search through all acts
private searchAllActs(searchTerm: string): void {
  console.log('Falling back to searching all ACTs...');
  
  this.actService.getAllActs().subscribe({
    next: (acts) => {
      // Filter acts that match the search term in matricule or name
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
fixTrainIdFromNumero(): void {
  const trainNumero = this.form.get('train.numero')?.value;
  
  if (!trainNumero) {
    alert('Veuillez d\'abord sélectionner un train.');
    return;
  }
  
  console.log('Trying to fix Train ID for numero:', trainNumero);
  
  this.trainService.getAllTrains().subscribe({
    next: (trains) => {
      const matchingTrain = trains.find(t => t.numero === trainNumero);
      
      if (matchingTrain) {
        console.log('Found matching train:', matchingTrain);
        
        // Update just the ID without changing other values
        this.form.patchValue({
          train: {
            id: matchingTrain.id
          }
        });
        
        console.log('Train ID fixed to:', matchingTrain.id);
        alert(`Train ID fixé à: ${matchingTrain.id}`);
      } else {
        console.log('No matching train found for numero:', trainNumero);
        alert(`Aucun train trouvé avec le numéro: ${trainNumero}`);
      }
    },
    error: (err) => {
      console.error('Error fetching trains:', err);
      alert('Erreur lors de la récupération des trains.');
    }
  });
}

// Manually set the train ID for testing
manuallySetTrainId(id: number): void {
  console.log('Manually setting Train ID to:', id);
  
  this.form.patchValue({
    train: {
      id: id
    }
  });
  
  // Verify the ID was set
  console.log('Train ID after manual set:', this.form.get('train.id')?.value);
  
  // Force the form to re-validate
  this.form.get('train')?.updateValueAndValidity();
  
  alert(`Train ID manuellement fixé à: ${id}`);
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
  
  // Mark all fields as touched to show validation errors
  this.markFormGroupTouched(this.form);
  
  if (this.form.invalid) {
    console.error('Form is invalid. Cannot submit.');
    
    // Build a list of invalid fields to show in the alert
    const invalidFields = [];
    
    // Check ACT section
    if (this.form.get('act.id')?.invalid) invalidFields.push('Agent ID');
    if (this.form.get('act.matricule')?.invalid) invalidFields.push('Matricule agent');
    if (this.form.get('act.nomPrenom')?.invalid) invalidFields.push('Nom/Prénom agent');
    
    // Check Train section
    if (this.form.get('train.id')?.invalid) invalidFields.push('Train ID');
    if (this.form.get('train.numero')?.invalid) invalidFields.push('Numéro train');
    if (this.form.get('train.gamme')?.invalid) invalidFields.push('Gamme train');
    
    // Check Gare section
    if (this.form.get('gare.id')?.invalid) invalidFields.push('Gare ID');
    if (this.form.get('gare.nom')?.invalid) invalidFields.push('Nom gare');
    
    // Check other fields
    if (this.form.get('dateCreation')?.invalid) invalidFields.push('Date création');
    if (this.form.get('dateInfraction')?.invalid) invalidFields.push('Date infraction');
    if (this.form.get('statut')?.invalid) invalidFields.push('Statut');
    if (this.form.get('montantAmende')?.invalid) invalidFields.push('Montant amende');
    if (this.form.get('motifInfraction')?.invalid) invalidFields.push('Motif infraction');
    if (this.form.get('numeroBillet')?.invalid) invalidFields.push('Numéro billet');
    
    // Check regularization fields if applicable
    if (this.form.get('statut')?.value === 'REGULARISEE') {
      if (this.form.get('dateRegularisation')?.invalid) invalidFields.push('Date régularisation');
      if (this.form.get('numeroPiecePaiement')?.invalid) invalidFields.push('Numéro pièce paiement');
    }
    
    // Show a detailed alert
    alert(`Veuillez remplir tous les champs obligatoires:\n\n${invalidFields.join('\n')}`);
    
    // Scroll to top to show validation panel
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showValidationDetails = true;
    
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
  
  console.log('Submitting form data:', lettreBillet);
  
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
        alert('Erreur lors de la création de la lettre de sommation: ' + (error.error?.message || error.message || 'Unknown error'));
        this.submitting = false;
        console.error('API Error:', error);
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
  /* Train Handling */
onTrainGammeChange(event: any): void {
  const gamme = event.target.value;
  console.log('Train gamme changed:', gamme); // Debug log
  
  // Reset train selection but keep the gamme
  this.form.patchValue({
    train: {
      id: null, // Clear the ID
      numero: '', // Clear the numero
      gamme: gamme // Keep the selected gamme
    }
  });
  
  // Load all trains and filter by the selected gamme
  this.trainService.getAllTrains().subscribe({
    next: (trains) => {
      console.log('All trains loaded:', trains);
      
      // Filter trains by the selected gamme pattern
      this.filteredTrains = trains.filter(train => 
        this.getTrainGamme(train.numero) === gamme
      );
      
      console.log('Filtered trains by gamme:', this.filteredTrains);
      
      // If there's only one train for this gamme, auto-select it
      if (this.filteredTrains.length === 1) {
        const train = this.filteredTrains[0];
        console.log('Auto-selecting single train:', train);
        
        this.form.patchValue({
          train: {
            id: train.id,
            numero: train.numero,
            gamme: gamme
          }
        });
        
        // Verify the ID was set
        console.log('Train ID after auto-selection:', this.form.get('train.id')?.value);
        
        this.filteredTrains = []; // Clear dropdown since we selected the only option
      }
    },
    error: (err) => {
      console.error('Error fetching trains:', err);
    }
  });
}

onTrainInput(event: any): void {
  const value = event.target.value;
  console.log('Train input value:', value); // Debug log
  
  if (value && value.length >= 2) {
    this.trainSearching = true;
    
    // Get all trains and filter by the input value
    this.trainService.getAllTrains().subscribe({
      next: (trains) => {
        // Filter trains by the input value
        this.filteredTrains = trains.filter(train => 
          train.numero.toLowerCase().includes(value.toLowerCase())
        );
        
        // If we have a gamme selected, further filter by gamme
        const selectedGamme = this.form.get('train.gamme')?.value;
        if (selectedGamme) {
          this.filteredTrains = this.filteredTrains.filter(train => 
            this.getTrainGamme(train.numero) === selectedGamme
          );
        }
        
        console.log('Filtered trains by input:', this.filteredTrains);
        this.trainSearching = false;
      },
      error: (err) => {
        console.error('Error fetching trains:', err);
        this.trainSearching = false;
      }
    });
  } else {
    this.filteredTrains = [];
  }
}

onTrainSelect(train: any): void {
  console.log('Train selected:', train); // Debug log
  
  if (!train || !train.id) {
    console.error('Selected train has no ID!', train);
    return;
  }
  
  // When a train is selected, determine its gamme
  const gamme = this.getTrainGamme(train.numero);
  
  // Make sure to set ALL properties, especially the ID
  this.form.patchValue({
    train: {
      id: train.id,
      numero: train.numero,
      gamme: gamme
    }
  });
  
  // Verify the ID was set properly
  console.log('Train form values after selection:', this.form.get('train')?.value);
  console.log('Train ID after selection:', this.form.get('train.id')?.value);
  
  this.filteredTrains = []; // Clear dropdown after selection
  
  // Force the form to re-validate
  this.form.get('train')?.updateValueAndValidity();
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