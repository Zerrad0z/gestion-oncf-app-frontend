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
  NON_REGULARISEE = 'NON_REGULARISEE',
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
  statuts = [StatutEnum.REGULARISEE, StatutEnum.NON_REGULARISEE];
  gammesTrains = ['TNR', 'TN', 'TGV'];
  
  // Train gamme mapping for determining gamme from train number
  trainGammeMapping: { [key: string]: string } = {
    // Add your specific train numbers here if needed
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
        gamme: ['', Validators.required]
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
        this.router.navigate(['/lettres-sommation/billet']);
      }
    });
  }

  // Helper method to extract piece number from comments
  extractPieceNumber(comments: string): string {
    const match = comments.match(/N° de PP:?\s*([A-Za-z0-9-]+)/i);
    return match ? match[1] : '';
  }

  // Helper method to determine train gamme based on train number
  getTrainGamme(trainNumero: string): string {
    if (this.trainGammeMapping[trainNumero]) {
      return this.trainGammeMapping[trainNumero];
    }
    
    if (trainNumero?.startsWith('TNR')) return 'TNR';
    if (trainNumero?.startsWith('TN')) return 'TN';
    if (trainNumero?.startsWith('TGV')) return 'TGV';
    
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
        
        if (/^\d+$/.test(term)) {
          return this.actService.getActByMatricule(term).pipe(
            map(act => [act]),
            catchError(() => {
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

    // Gare search
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

    // Train search
    this.trainSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([]);
        this.trainSearching = true;
        
        return this.trainService.getAllTrains().pipe(
          map(trains => {
            const filteredByNumber = trains.filter(train => 
              train.numero.toLowerCase().includes(term.toLowerCase())
            );
            
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

  /* Event Handlers */
  onActInput(event: any): void {
    const value = event.target.value;
    
    if (value && value.length >= 3) {
      this.actSearching = true;
      this.actSearchFailed = false;
      
      this.actService.getActByMatricule(value).subscribe({
        next: (act) => {
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
        error: () => {
          this.actSearching = false;
          this.actSearchFailed = true;
          this.searchAllActs(value);
          setTimeout(() => this.actSearchFailed = false, 5000);
        }
      });
    } else {
      this.filteredActs = [];
    }
  }

  private searchAllActs(searchTerm: string): void {
    this.actService.getAllActs().subscribe({
      next: (acts) => {
        this.filteredActs = acts.filter(act => 
          act.matricule.toLowerCase().includes(searchTerm.toLowerCase()) || 
          act.nomPrenom.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (this.filteredActs.length === 0) {
          this.actSearchFailed = true;
          setTimeout(() => this.actSearchFailed = false, 5000);
        }
      },
      error: () => {
        this.actSearchFailed = true;
        setTimeout(() => this.actSearchFailed = false, 5000);
      }
    });
  }
  
  onActSelect(act: any): void {
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

  onGareInput(event: any): void {
    const value = event.target.value;
    if (value && value.length >= 2) {
      this.gareSearch$.next(value);
    } else {
      this.filteredGares = [];
      // Clear the gare selection if input is cleared
      if (!value) {
        this.form.patchValue({
          gare: {
            id: null,
            nom: ''
          }
        });
      }
    }
  }
  
  onGareSelect(gare: any): void {
    this.form.patchValue({
      gare: {
        id: gare.id,
        nom: gare.nom
      }
    });
    this.filteredGares = [];
  }

  onTrainGammeChange(event: any): void {
    const gamme = event.target.value;
    // Just update the gamme field - NO relationship to train selection
    this.form.patchValue({
      train: {
        id: this.form.get('train.id')?.value,
        numero: this.form.get('train.numero')?.value,
        gamme: gamme
      }
    });
  }

  onTrainInput(event: any): void {
    const value = event.target.value;
    
    if (value && value.length >= 2) {
      this.trainSearching = true;
      this.trainSearchFailed = false;
      
      this.trainService.getAllTrains().subscribe({
        next: (trains) => {
          // Show ALL trains that match the input - NO gamme filtering
          this.filteredTrains = trains.filter(train => 
            train.numero.toLowerCase().includes(value.toLowerCase())
          );
          
          this.trainSearching = false;
        },
        error: (err) => {
          this.trainSearching = false;
          this.trainSearchFailed = true;
          setTimeout(() => this.trainSearchFailed = false, 5000);
        }
      });
    } else {
      this.filteredTrains = [];
      // Clear train selection if input is cleared
      if (!value) {
        this.form.patchValue({
          train: {
            id: null,
            numero: '',
            gamme: this.form.get('train.gamme')?.value || ''
          }
        });
      }
    }
  }

  onTrainSelect(train: any): void {
    if (!train?.id) {
      return;
    }
    
    // Just select the train - DON'T change the gamme
    this.form.patchValue({
      train: {
        id: train.id,
        numero: train.numero,
        gamme: this.form.get('train.gamme')?.value || '' // Keep existing gamme
      }
    });
    
    this.filteredTrains = [];
    
    // Mark as touched for validation
    this.form.get('train')?.markAsTouched();
    this.form.get('train.id')?.markAsTouched();
    this.form.get('train.numero')?.markAsTouched();
  }

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

  onSubmit(): void {
    this.markFormGroupTouched(this.form);
    
    if (this.form.invalid) {
      alert('Veuillez remplir tous les champs obligatoires correctement.');
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
    
    // Add regularization info if applicable
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
    
    formData.append('lettre', new Blob([JSON.stringify(lettreBillet)], {
      type: 'application/json'
    }));
    
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
          alert('Erreur lors de la mise à jour: ' + (error.error?.message || error.message));
          this.submitting = false;
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
          alert('Erreur lors de la création: ' + (error.error?.message || error.message));
          this.submitting = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/lettres-sommation/billet']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}