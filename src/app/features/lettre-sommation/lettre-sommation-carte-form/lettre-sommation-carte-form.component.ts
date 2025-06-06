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
import { LettreSommationCarteService } from '../../../services/lettre-sommation-carte.service';
import { PermissionService } from '../../../services/permission.service';
import { AuthService } from '../../../services/auth.service';

enum StatutEnum {
  REGULARISEE = 'REGULARISEE',
  NON_REGULARISEE = 'NON_REGULARISEE'
}

@Component({
  selector: 'app-lettre-sommation-carte-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './lettre-sommation-carte-form.component.html',
  styleUrls: ['./lettre-sommation-carte-form.component.scss']
})
export class LettreSommationCarteFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  lettreId?: number;
  loading = false;
  submitting = false;
  
  // Permission flags
  canCreate = false;
  canUpdate = false;
  canEditThisDocument = false;
  
  // Current user info
  currentUser: any = null;
  
  // Typeahead Search - ACT, Gare and Gare de règlement
  actSearching = false;
  actSearchFailed = false;
  actSearch$ = new Subject<string>();
  
  gareSearching = false;
  gareSearchFailed = false;
  gareSearch$ = new Subject<string>();
  
  gareReglementSearching = false;
  gareReglementSearchFailed = false;
  gareReglementSearch$ = new Subject<string>();
  
  // Train dropdown
  trainLoading = false;
  allTrains: any[] = [];
  
  // Dropdown data
  statuts = [StatutEnum.REGULARISEE, StatutEnum.NON_REGULARISEE];
  gammesTrains = ['TNR', 'TL', 'TGV']; // Independent field, not related to actual trains
  
  // Filtered options
  filteredActs: any[] = [];
  filteredGares: any[] = [];
  filteredGaresReglement: any[] = [];
  
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
    private lettreSommationCarteService: LettreSommationCarteService,
    public permissionService: PermissionService, // Make it public for template access
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    console.log('🚀 Component initializing...');
    
    // Check authentication and permissions first
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Current user:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('❌ No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Set permission flags using AuthService directly
    this.canCreate = this.authService.isEncadrant();
    this.canUpdate = this.authService.isEncadrant() || this.authService.isAdmin();
    
    console.log('🔒 Permissions:', {
      canCreate: this.canCreate,
      canUpdate: this.canUpdate,
      userRole: this.userRole
    });

    this.initializeForm();
    this.loadAllTrains();
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.lettreId = +id;
        this.isEditMode = true;
        console.log('✏️ Edit mode activated for ID:', this.lettreId);
        
        // Check permissions for edit mode
        if (!this.canUpdate) {
          console.log('❌ No update permission');
          alert(this.getAccessDeniedMessage('edit'));
          this.router.navigate(['/lettres-sommation/carte']);
          return;
        }
        
        this.loadLettreSommationCarte(this.lettreId);
      } else {
        console.log('➕ Create mode activated');
        // Check permissions for create mode
        if (!this.canCreate) {
          console.log('❌ No create permission');
          alert(this.getAccessDeniedMessage('create'));
          this.router.navigate(['/lettres-sommation/carte']);
          return;
        }
      }
    });
    
    this.setupTypeaheadSearch();
    console.log('✅ Component initialization complete');
  }

  initializeForm(): void {
    console.log('📝 Initializing form...');
    
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
      gare: this.fb.group({
        id: [null, Validators.required],
        nom: ['', Validators.required],
        gareReglement: [''] // Move gareReglement inside gare group
      }),
      dateCreation: [new Date().toISOString().split('T')[0], Validators.required],
      dateInfraction: [new Date().toISOString().split('T')[0], Validators.required],
      statut: [StatutEnum.NON_REGULARISEE, Validators.required],
      numeroPpRegularisation: [''],
      montantAmende: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
      typeCarte: ['', Validators.required],
      numeroCarte: ['', Validators.required],
      commentaires: [''],
      // Regularization fields
      dateRegularisation: ['']
    });
    
    console.log('📝 Form structure created:', this.form.value);
    
    // Add listener for status changes to handle regularization fields
    this.form.get('statut')?.valueChanges.subscribe(value => {
      console.log('📊 Status changed to:', value);
      
      if (value === 'REGULARISEE') {
        console.log('✅ Adding regularization validators');
        this.form.get('dateRegularisation')?.setValidators([Validators.required]);
        this.form.get('numeroPpRegularisation')?.setValidators([Validators.required]);
      } else {
        console.log('❌ Removing regularization validators');
        this.form.get('dateRegularisation')?.clearValidators();
        this.form.get('numeroPpRegularisation')?.clearValidators();
        this.form.get('dateRegularisation')?.setValue('');
        this.form.get('numeroPpRegularisation')?.setValue('');
      }
      this.form.get('dateRegularisation')?.updateValueAndValidity();
      this.form.get('numeroPpRegularisation')?.updateValueAndValidity();
      
      console.log('📊 Form validity after status change:', this.form.valid);
    });
    
    // Add form value changes listener for debugging
    this.form.valueChanges.subscribe(() => {
      console.log('📊 Form validity changed:', this.form.valid);
      if (!this.form.valid) {
        console.log('❌ Form errors:', this.getFormValidationErrors());
      }
    });
    
    console.log('✅ Form initialization complete');
  }

  loadLettreSommationCarte(id: number): void {
    console.log('📖 Loading lettre sommation carte with ID:', id);
    this.loading = true;
    
    this.lettreSommationCarteService.getLettreSommationCarteById(id).subscribe({
      next: (lettre) => {
        console.log('📖 Lettre loaded:', lettre);
        
        // Check if current user can edit this specific document
        this.canEditThisDocument = this.canEditDocument(lettre);
        console.log('🔒 Can edit this document:', this.canEditThisDocument);
        
        if (!this.canEditThisDocument) {
          console.log('❌ Cannot edit this document');
          alert(this.getAccessDeniedMessage('edit'));
          this.router.navigate(['/lettres-sommation/carte']);
          return;
        }

        const formValue = {
          act: {
            id: lettre.act.id,
            matricule: lettre.act.matricule,
            nomPrenom: lettre.act.nomPrenom,
            antenne: lettre.act.antenne
          },
          train: {
            id: lettre.train.id,
            numero: lettre.train.numero,
            gamme: ''
          },
          gare: {
            id: lettre.gare.id,
            nom: lettre.gare.nom,
            gareReglement: lettre.gareReglement || ''
          },
          dateCreation: lettre.dateCreation.split('T')[0],
          dateInfraction: lettre.dateInfraction.split('T')[0],
          statut: lettre.statut,
          numeroPpRegularisation: lettre.numeroPpRegularisation,
          montantAmende: lettre.montantAmende,
          typeCarte: lettre.typeCarte,
          numeroCarte: lettre.numeroCarte,
          commentaires: lettre.commentaires
        };
        
        console.log('📝 Patching form with:', formValue);
        this.form.patchValue(formValue);
        
        // Set regularization fields if status is REGULARISEE
        if (lettre.statut === 'REGULARISEE' && lettre.dateTraitement) {
          this.form.patchValue({
            dateRegularisation: lettre.dateTraitement.split('T')[0]
          });
          console.log('📅 Set regularization date:', lettre.dateTraitement.split('T')[0]);
        }
        
        this.loading = false;
        console.log('✅ Form loaded successfully, valid:', this.form.valid);
      },
      error: (error) => {
        console.error('❌ Error loading lettre:', error);
        alert('Erreur lors du chargement de la lettre de sommation: ' + error.message);
        this.loading = false;
        this.router.navigate(['/lettres-sommation/carte']);
      }
    });
  }

  // Load all trains for dropdown
  loadAllTrains(): void {
    console.log('🚂 Loading all trains...');
    this.trainLoading = true;
    
    this.trainService.getAllTrains().subscribe({
      next: (trains) => {
        this.allTrains = trains;
        this.trainLoading = false;
        console.log('🚂 All trains loaded:', trains.length, 'trains');
      },
      error: (err) => {
        console.error('❌ Error loading trains:', err);
        this.trainLoading = false;
      }
    });
  }

  // Handle train dropdown selection
  onTrainDropdownSelect(event: any): void {
    const trainId = +event.target.value;
    console.log('🚂 Train selected from dropdown, ID:', trainId);
    
    if (trainId) {
      const selectedTrain = this.allTrains.find(train => train.id === trainId);
      
      if (selectedTrain) {
        console.log('🚂 Selected train details:', selectedTrain);
        
        // Set train form values (gamme is independent, so keep existing value)
        const trainFormValue = {
          id: selectedTrain.id,
          numero: selectedTrain.numero,
          gamme: this.form.get('train.gamme')?.value || '' // Keep existing gamme value
        };
        
        console.log('📝 Setting train form value:', trainFormValue);
        
        this.form.patchValue({
          train: trainFormValue
        });
        
        // Manually mark as touched
        this.form.get('train')?.markAsTouched();
        this.form.get('train.id')?.markAsTouched();
        
        console.log('🚂 Train form after selection:', this.form.get('train')?.value);
        console.log('🚂 Train form valid:', this.form.get('train')?.valid);
        console.log('🚂 Overall form valid:', this.form.valid);
      }
    } else {
      console.log('🚂 Clearing train selection');
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
    console.log('🔍 Setting up typeahead search...');
    
    // ACT search
    this.actSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 3) return of([]);
        this.actSearching = true;
        console.log('🔍 Searching ACT with term:', term);
        
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
      console.log('🔍 ACT search results:', acts.length, 'found');
    });

    // Gare typeahead search
    this.gareSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([]);
        this.gareSearching = true;
        console.log('🔍 Searching Gare with term:', term);
        
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
      console.log('🔍 Gare search results:', gares.length, 'found');
    });

    // Gare de règlement typeahead search (same as gare)
    this.gareReglementSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([]);
        this.gareReglementSearching = true;
        console.log('🔍 Searching Gare de règlement with term:', term);
        
        return this.gareService.getAllGares().pipe(
          map(gares => gares.filter(gare => 
            gare.nom.toLowerCase().includes(term.toLowerCase())
          )),
          catchError(() => {
            this.gareReglementSearchFailed = true;
            return of([]);
          })
        );
      })
    ).subscribe(gares => {
      this.filteredGaresReglement = gares;
      this.gareReglementSearching = false;
      console.log('🔍 Gare de règlement search results:', gares.length, 'found');
    });
    
    console.log('✅ Typeahead search setup complete');
  }

  /* ACT Handling */
  onActInput(event: any): void {
    const value = event.target.value;
    console.log('👤 ACT input value:', value);
    
    if (value && value.length >= 3) {
      this.actSearching = true;
      this.actSearchFailed = false;
      
      console.log('🔍 Searching for ACT by matricule:', value);
      
      this.actService.getActByMatricule(value).subscribe({
        next: (act) => {
          console.log('👤 ACT found:', act);
          
          if (act) {
            const actFormValue = {
              id: act.id,
              matricule: act.matricule,
              nomPrenom: act.nomPrenom,
              antenne: act.antenne
            };
            
            console.log('📝 Setting ACT form value:', actFormValue);
            
            this.form.patchValue({
              act: actFormValue
            });
            
            // Manually mark as touched
            this.form.get('act')?.markAsTouched();
            this.form.get('act.id')?.markAsTouched();
            this.form.get('act.matricule')?.markAsTouched();
            
            this.actSearching = false;
            this.filteredActs = [];
            
            console.log('👤 ACT form after input:', this.form.get('act')?.value);
            console.log('👤 ACT form valid:', this.form.get('act')?.valid);
          }
        },
        error: (err) => {
          console.log('❌ ACT not found by matricule, trying search all...');
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
    console.log('🔍 Falling back to searching all ACTs...');
    
    this.actService.getAllActs().subscribe({
      next: (acts) => {
        this.filteredActs = acts.filter(act => 
          act.matricule.toLowerCase().includes(searchTerm.toLowerCase()) || 
          act.nomPrenom.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        console.log(`🔍 Found ${this.filteredActs.length} ACTs matching "${searchTerm}"`);
        
        if (this.filteredActs.length === 0) {
          this.actSearchFailed = true;
          setTimeout(() => {
            this.actSearchFailed = false;
          }, 5000);
        }
      },
      error: (err) => {
        console.error('❌ Error searching all ACTs:', err);
        this.actSearchFailed = true;
        setTimeout(() => {
          this.actSearchFailed = false;
        }, 5000);
      }
    });
  }
  
  onActSelect(act: any): void {
    console.log('👤 ACT selected:', act);
    
    const actFormValue = {
      id: act.id || null,
      matricule: act.matricule || '',
      nomPrenom: act.nomPrenom || '',
      antenne: act.antenne || null
    };
    
    console.log('📝 Setting selected ACT form value:', actFormValue);
    
    this.form.patchValue({
      act: actFormValue
    });
    
    this.filteredActs = [];
    
    // Manually mark the act group as touched to trigger validation
    this.form.get('act')?.markAsTouched();
    this.form.get('act.id')?.markAsTouched();
    this.form.get('act.matricule')?.markAsTouched();
    
    console.log('👤 After ACT selection - form value:', this.form.get('act')?.value);
    console.log('👤 After ACT selection - form valid:', this.form.get('act')?.valid);
    console.log('👤 After ACT selection - overall form valid:', this.form.valid);
  }

  // Replace your onGareSelect method with this:
onGareSelect(gare: any): void {
  console.log('🏢 Gare selected:', gare);
  
  // Debug: Check if gare has an id
  console.log('🏢 Gare ID:', gare.id);
  console.log('🏢 Gare object keys:', Object.keys(gare));
  
  if (!gare.id) {
    console.error('❌ Selected gare has no ID:', gare);
    alert('Erreur: La gare sélectionnée n\'a pas d\'identifiant valide');
    return;
  }
  
  // Update the form with the selected gare
  this.form.patchValue({
    gare: {
      id: gare.id,  // This is the critical missing piece
      nom: gare.nom || '',
      gareReglement: this.form.get('gare.gareReglement')?.value || ''
    }
  });
  
  // Clear the dropdown
  this.filteredGares = [];
  
  // Mark as touched for validation
  this.form.get('gare')?.markAsTouched();
  this.form.get('gare.id')?.markAsTouched();
  this.form.get('gare.nom')?.markAsTouched();
  
  // Debug after selection
  console.log('🏢 Form gare value after selection:', this.form.get('gare')?.value);
  console.log('🏢 Gare ID in form:', this.form.get('gare.id')?.value);
  console.log('🏢 Form valid after gare selection:', this.form.valid);
}

onGareInput(event: any): void {
  const value = event.target.value;
  console.log('🏢 Gare input value:', value);
  
  if (value && value.length >= 2) {
    this.gareSearch$.next(value);
  } else {
    this.filteredGares = [];
    // Clear the gare selection if input is cleared
    if (!value) {
      this.form.patchValue({
        gare: {
          id: null,
          nom: '',
          gareReglement: this.form.get('gare.gareReglement')?.value || ''
        }
      });
    }
  }
}

  /* Gare de règlement Handling */
  onGareReglementInput(event: any): void {
    const value = event.target.value;
    console.log('🏢 Gare de règlement input value:', value);
    
    if (value && value.length >= 2) {
      this.gareReglementSearch$.next(value);
    } else {
      this.filteredGaresReglement = [];
    }
  }
  
  onGareReglementSelect(gare: any): void {
    console.log('🏢 Gare de règlement selected:', gare);
    
    this.form.patchValue({
      gare: {
        gareReglement: gare.nom
      }
    });
    this.filteredGaresReglement = [];
    
    console.log('🏢 After Gare de règlement selection - form value:', this.form.get('gare')?.value);
  }

  /* File Handling */
  onFileSelected(event: any): void {
    const files = event.target.files;
    console.log('📎 Files selected:', files.length);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      console.log('📎 Processing file:', file.name, 'Size:', file.size);
      
      if (file.size > this.maxFileSize) {
        console.log('❌ File too large:', file.name);
        alert(`Le fichier ${file.name} est trop volumineux. Taille maximale: 5MB`);
        continue;
      }
      
      this.selectedFiles.push(file);
      console.log('✅ File added:', file.name);
    }
    
    console.log('📎 Total selected files:', this.selectedFiles.length);
  }

  removeFile(index: number): void {
    const fileName = this.selectedFiles[index].name;
    this.selectedFiles.splice(index, 1);
    console.log('🗑️ File removed:', fileName);
    console.log('📎 Remaining files:', this.selectedFiles.length);
  }

  // ===== DEBUG METHOD =====
  debugForm(): void {
    console.log('🐛 ===== FORM DEBUG =====');
    console.log('🐛 Form valid:', this.form.valid);
    console.log('🐛 Form touched:', this.form.touched);
    console.log('🐛 Form dirty:', this.form.dirty);
    console.log('🐛 Form value:', this.form.value);
    console.log('🐛 Form errors:', this.getFormValidationErrors());
    
    // Check each main group
    console.log('🐛 === ACT GROUP ===');
    console.log('🐛 ACT group valid:', this.form.get('act')?.valid);
    console.log('🐛 ACT group errors:', this.form.get('act')?.errors);
    console.log('🐛 ACT ID:', this.form.get('act.id')?.value);
    console.log('🐛 ACT ID valid:', this.form.get('act.id')?.valid);
    console.log('🐛 ACT ID errors:', this.form.get('act.id')?.errors);
    console.log('🐛 ACT matricule:', this.form.get('act.matricule')?.value);
    console.log('🐛 ACT matricule valid:', this.form.get('act.matricule')?.valid);
    console.log('🐛 ACT matricule errors:', this.form.get('act.matricule')?.errors);
    
    console.log('🐛 === TRAIN GROUP ===');
    console.log('🐛 Train group valid:', this.form.get('train')?.valid);
    console.log('🐛 Train group errors:', this.form.get('train')?.errors);
    console.log('🐛 Train ID:', this.form.get('train.id')?.value);
    console.log('🐛 Train ID valid:', this.form.get('train.id')?.valid);
    console.log('🐛 Train ID errors:', this.form.get('train.id')?.errors);
    
    console.log('🐛 === GARE GROUP ===');
    console.log('🐛 Gare group valid:', this.form.get('gare')?.valid);
    console.log('🐛 Gare group errors:', this.form.get('gare')?.errors);
    console.log('🐛 Gare ID:', this.form.get('gare.id')?.value);
    console.log('🐛 Gare ID valid:', this.form.get('gare.id')?.valid);
    console.log('🐛 Gare ID errors:', this.form.get('gare.id')?.errors);
    console.log('🐛 Gare nom:', this.form.get('gare.nom')?.value);
    console.log('🐛 Gare nom valid:', this.form.get('gare.nom')?.valid);
    console.log('🐛 Gare nom errors:', this.form.get('gare.nom')?.errors);
    
    console.log('🐛 === OTHER FIELDS ===');
    console.log('🐛 Date creation valid:', this.form.get('dateCreation')?.valid);
    console.log('🐛 Date creation errors:', this.form.get('dateCreation')?.errors);
    console.log('🐛 Date infraction valid:', this.form.get('dateInfraction')?.valid);
    console.log('🐛 Date infraction errors:', this.form.get('dateInfraction')?.errors);
    console.log('🐛 Statut valid:', this.form.get('statut')?.valid);
    console.log('🐛 Statut errors:', this.form.get('statut')?.errors);
    console.log('🐛 Montant amende valid:', this.form.get('montantAmende')?.valid);
    console.log('🐛 Montant amende errors:', this.form.get('montantAmende')?.errors);
    console.log('🐛 Type carte valid:', this.form.get('typeCarte')?.valid);
    console.log('🐛 Type carte errors:', this.form.get('typeCarte')?.errors);
    console.log('🐛 Numero carte valid:', this.form.get('numeroCarte')?.valid);
    console.log('🐛 Numero carte errors:', this.form.get('numeroCarte')?.errors);
    
    // Check permissions
    console.log('🐛 === PERMISSIONS ===');
    console.log('🐛 Can create:', this.canCreate);
    console.log('🐛 Can update:', this.canUpdate);
    console.log('🐛 Can edit this document:', this.canEditThisDocument);
    console.log('🐛 Is edit mode:', this.isEditMode);
    console.log('🐛 Submitting:', this.submitting);
    
    // Button condition check
    const buttonDisabled = this.submitting || this.form.invalid || (!this.isEditMode && !this.canCreate) || (this.isEditMode && !this.canEditThisDocument);
    
    console.log('🐛 === BUTTON STATE ===');
    console.log('🐛 Button disabled:', buttonDisabled);
    console.log('🐛 - submitting:', this.submitting);
    console.log('🐛 - form.invalid:', this.form.invalid);
    console.log('🐛 - (!isEditMode && !canCreate):', (!this.isEditMode && !this.canCreate));
    console.log('🐛 - (isEditMode && !canEditThisDocument):', (this.isEditMode && !this.canEditThisDocument));
    
    console.log('🐛 ===== END DEBUG =====');
  }

  /* Form Submission */
 /* Form Submission */
onSubmit(): void {
  console.log('🚀 ===== FORM SUBMISSION =====');
  console.log('🚀 Form submitted, valid:', this.form.valid);
  console.log('🚀 Form values:', this.form.value);
  
  // Check permissions before submission
  if (this.isEditMode && !this.canEditThisDocument) {
    console.log('❌ No permission to edit this document');
    alert(this.getAccessDeniedMessage('edit'));
    return;
  }
  
  if (!this.isEditMode && !this.canCreate) {
    console.log('❌ No permission to create');
    alert(this.getAccessDeniedMessage('create'));
    return;
  }
  
  this.markFormGroupTouched(this.form);
  
  if (this.form.invalid) {
    console.error('❌ Form is invalid. Cannot submit.');
    console.error('❌ Form errors:', this.getFormValidationErrors());
    
    const invalidFields = [];
    
    if (this.form.get('act.id')?.invalid) invalidFields.push('Agent ID');
    if (this.form.get('act.matricule')?.invalid) invalidFields.push('Matricule agent');
    if (this.form.get('act.nomPrenom')?.invalid) invalidFields.push('Nom/Prénom agent');
    
    if (this.form.get('train.id')?.invalid) invalidFields.push('Train ID');
    
    if (this.form.get('gare.id')?.invalid) invalidFields.push('Gare ID');
    if (this.form.get('gare.nom')?.invalid) invalidFields.push('Nom gare');
    
    if (this.form.get('dateCreation')?.invalid) invalidFields.push('Date création');
    if (this.form.get('dateInfraction')?.invalid) invalidFields.push('Date infraction');
    if (this.form.get('statut')?.invalid) invalidFields.push('Statut');
    if (this.form.get('montantAmende')?.invalid) invalidFields.push('Montant amende');
    if (this.form.get('typeCarte')?.invalid) invalidFields.push('Type carte');
    if (this.form.get('numeroCarte')?.invalid) invalidFields.push('Numéro carte');
    
    if (this.form.get('statut')?.value === 'REGULARISEE') {
      if (this.form.get('dateRegularisation')?.invalid) invalidFields.push('Date régularisation');
      if (this.form.get('numeroPpRegularisation')?.invalid) invalidFields.push('Numéro PP régularisation');
    }
    
    console.error('❌ Invalid fields:', invalidFields);
    alert(`Veuillez remplir tous les champs obligatoires:\n\n${invalidFields.join('\n')}`);
    return;
  }
  
  console.log('✅ Form is valid, proceeding with submission...');
  this.submitting = true;
  
  // Prepare data object for submission
  const lettreCarte = {
    actId: this.form.value.act.id,
    trainId: this.form.value.train.id,
    gareId: this.form.value.gare.id,
    dateCreation: this.form.value.dateCreation,
    dateInfraction: this.form.value.dateInfraction,
    statut: this.form.value.statut,
    gareReglement: this.form.value.gare.gareReglement,
    numeroPpRegularisation: this.form.value.numeroPpRegularisation,
    montantAmende: this.form.value.montantAmende,
    typeCarte: this.form.value.typeCarte,
    numeroCarte: this.form.value.numeroCarte,
    commentaires: this.form.value.commentaires
  };
  
  // Add regularization info if applicable
  if (this.form.value.statut === 'REGULARISEE') {
    if (this.form.value.dateRegularisation) {
      lettreCarte.commentaires = lettreCarte.commentaires 
        ? `${lettreCarte.commentaires}\n\nDate de régularisation: ${this.form.value.dateRegularisation}` 
        : `Date de régularisation: ${this.form.value.dateRegularisation}`;
    }
  }
  
  console.log('🚀 Submitting form data:', lettreCarte);
  console.log('🚀 Files count:', this.selectedFiles.length);
  
  // *** FIXED FORMDATA CONSTRUCTION FOR SPRING BOOT ***
  const formData = new FormData();
  
  // Add the JSON data as a Blob with the correct part name "lettre"
  const lettreBlob = new Blob([JSON.stringify(lettreCarte)], {
    type: 'application/json'
  });
  formData.append('lettre', lettreBlob);
  
  // Add files with the correct part name "fichiers" (if any)
  if (this.selectedFiles.length > 0) {
    this.selectedFiles.forEach((file) => {
      formData.append('fichiers', file);
    });
    console.log('📎 Added', this.selectedFiles.length, 'files to formData');
  } else {
    console.log('📎 No files to upload');
  }
  
  // Debug: Log FormData contents
  console.log('📦 FormData contents:');
  for (let pair of formData.entries()) {
    const value = pair[1];
    if (value && typeof value === 'object' && 'name' in value && 'size' in value) {
      // It's a File
      const file = value as File;
      console.log('📦', pair[0], '→ File:', file.name, 'Size:', file.size);
    } else if (value && typeof value === 'object' && 'size' in value) {
      // It's a Blob
      const blob = value as Blob;
      console.log('📦', pair[0], '→ Blob, Size:', blob.size);
    } else {
      console.log('📦', pair[0], '→', value);
    }
  }
  
  // Validate required IDs before sending
  console.log('✏️ ID Validation:');
  console.log('✏️ - actId:', lettreCarte.actId, 'type:', typeof lettreCarte.actId);
  console.log('✏️ - trainId:', lettreCarte.trainId, 'type:', typeof lettreCarte.trainId);
  console.log('✏️ - gareId:', lettreCarte.gareId, 'type:', typeof lettreCarte.gareId);
  
  // Check for potential data issues
  if (!lettreCarte.actId || !lettreCarte.trainId || !lettreCarte.gareId) {
    console.error('❌ Missing required IDs!');
    alert('Erreur: Des identifiants requis sont manquants (ACT, Train, ou Gare)');
    this.submitting = false;
    return;
  }
  
  if (this.isEditMode && this.lettreId) {
    console.log('✏️ === EDIT MODE ===');
    console.log('✏️ Updating existing lettre with ID:', this.lettreId);
    console.log('✏️ Current user:', this.currentUser);
    console.log('✏️ Can edit this document:', this.canEditThisDocument);
    console.log('✏️ Update URL:', `/lettres-sommation-carte/${this.lettreId}`);
    
    this.lettreSommationCarteService.updateLettreSommationCarte(this.lettreId, formData).subscribe({
      next: (response) => {
        console.log('✅ Update successful:', response);
        alert('Lettre de sommation mise à jour avec succès');
        this.submitting = false;
        this.router.navigate(['/lettres-sommation/carte']);
      },
      error: (error) => {
        console.error('❌ === DETAILED UPDATE ERROR ===');
        console.error('❌ Full error object:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Status Text:', error.statusText);
        console.error('❌ Error.error:', error.error);
        console.error('❌ Error.message:', error.message);
        console.error('❌ Error.name:', error.name);
        console.error('❌ Error.url:', error.url);
        
        // Try to extract more details from the error
        if (error.error) {
          console.error('❌ Server response body:', error.error);
          if (typeof error.error === 'string') {
            console.error('❌ Server response as string:', error.error);
          }
          if (error.error.message) {
            console.error('❌ Server error message:', error.error.message);
          }
          if (error.error.details) {
            console.error('❌ Server error details:', error.error.details);
          }
        }
        
        // Log the request details for debugging
        console.error('❌ Request details:');
        console.error('❌ - Lettre ID:', this.lettreId);
        console.error('❌ - Current user ID:', this.currentUser?.id);
        console.error('❌ - User role:', this.currentUser?.role);
        console.error('❌ - Can edit document:', this.canEditThisDocument);
        console.error('❌ - Data sent:', lettreCarte);
        
        // Check specific error cases and provide better error messages
        let errorMessage = 'Erreur lors de la mise à jour';
        let detailedMessage = '';
        
        switch (error.status) {
          case 400:
            errorMessage = 'Données invalides';
            detailedMessage = 'Vérifiez que tous les champs obligatoires sont remplis correctement.';
            break;
          case 401:
            errorMessage = 'Non autorisé';
            detailedMessage = 'Votre session a peut-être expiré. Reconnectez-vous.';
            break;
          case 403:
            errorMessage = 'Accès refusé';
            detailedMessage = 'Vous n\'avez pas le droit de modifier cette lettre de sommation.';
            break;
          case 404:
            errorMessage = 'Lettre non trouvée';
            detailedMessage = `La lettre de sommation avec l'ID ${this.lettreId} n'existe pas.`;
            break;
          case 422:
            errorMessage = 'Données non valides';
            detailedMessage = 'Certains champs contiennent des valeurs non acceptées par le serveur.';
            break;
          case 500:
            errorMessage = 'Erreur serveur interne';
            detailedMessage = 'Une erreur est survenue sur le serveur. Vérifiez les logs serveur.';
            break;
          case 0:
            errorMessage = 'Erreur de connexion';
            detailedMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
            break;
          default:
            errorMessage = `Erreur ${error.status}`;
            detailedMessage = error.statusText || 'Erreur inconnue';
        }
        
        // Show user-friendly error message
        let fullErrorMessage = `${errorMessage}: ${detailedMessage}`;
        if (error.error?.message) {
          fullErrorMessage += `\n\nDétails: ${error.error.message}`;
        }
        
        alert(fullErrorMessage);
        this.submitting = false;
      }
    });
  } else {
    console.log('➕ === CREATE MODE ===');
    console.log('➕ Creating new lettre');
    console.log('➕ Data being sent:', lettreCarte);
    
    this.lettreSommationCarteService.createLettreSommationCarte(formData).subscribe({
      next: (response) => {
        console.log('✅ Creation successful:', response);
        alert('Lettre de sommation créée avec succès');
        this.submitting = false;
        this.router.navigate(['/lettres-sommation/carte']);
      },
      error: (error) => {
        console.error('❌ === DETAILED CREATION ERROR ===');
        console.error('❌ Full error object:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Status Text:', error.statusText);
        console.error('❌ Error.error:', error.error);
        console.error('❌ Error.message:', error.message);
        
        let errorMessage = 'Erreur lors de la création';
        if (error.status === 400) {
          errorMessage = 'Données invalides. Vérifiez les champs requis.';
        } else if (error.status === 409) {
          errorMessage = 'Conflit: Cette lettre de sommation existe déjà.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de la création.';
        }
        
        alert(errorMessage + ': ' + (error.error?.message || error.message));
        this.submitting = false;
      }
    });
  }
}
  
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
    console.log('❌ Form cancelled');
    this.router.navigate(['/lettres-sommation/carte']);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    console.log('👆 Marking form group as touched');
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods for template
  get userRole(): string {
    return this.currentUser?.role || 'GUEST';
  }

  get userName(): string {
    return this.currentUser?.nomPrenom || 'Utilisateur';
  }

  get showCreateHelper(): boolean {
    return !this.isEditMode && this.canCreate;
  }

  get showEditHelper(): boolean {
    return this.isEditMode && this.canEditThisDocument;
  }

  // Permission helper methods
  canEditDocument(document: any): boolean {
    if (!this.currentUser) return false;
    
    // Admin can edit any document
    if (this.authService.isAdmin()) return true;
    
    // Encadrant can only edit their own documents
    if (this.authService.isEncadrant()) {
      return document.utilisateur && document.utilisateur.id === this.currentUser.id;
    }
    
    return false;
  }

  getAccessDeniedMessage(action: string): string {
    const role = this.currentUser?.role;
    
    switch (action) {
      case 'create':
        return 'Seuls les encadrants peuvent créer des lettres de sommation.';
      case 'edit':
        return role === 'ENCADRANT' 
          ? 'Vous ne pouvez modifier que vos propres lettres de sommation.' 
          : 'Seuls les encadrants et administrateurs peuvent modifier des lettres de sommation.';
      case 'delete':
        return 'Seuls les administrateurs peuvent supprimer des lettres de sommation.';
      case 'bulk_status':
        return 'Seuls les superviseurs et administrateurs peuvent modifier le statut en lot.';
      default:
        return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
  }
}