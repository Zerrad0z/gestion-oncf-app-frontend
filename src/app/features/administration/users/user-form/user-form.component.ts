// src/app/features/administration/users/user-form/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { UserRole } from '../../../../core/models/user.model';
import { ActService } from '../../../../services/act.service'; // You'll need to create this service

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  standalone: true
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isEditMode = false;
  loading = false;
  loadingActs = false;
  error: string | null = null;
  submitAttempted = false;
  acts: any[] = []; // Replace with your ACT model
  
  // Make enum available in template
  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private actService: ActService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    //this.loadActs();
    
    // Check if we're in edit mode
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadUser(+id);
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      nomPrenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      nomUtilisateur: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      role: [UserRole.ENCADRANT, Validators.required],
      actif: [true],
      actId: [null],
      motDePasse: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', this.isEditMode ? [] : [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(group: FormGroup): {[key: string]: any} | null {
    const password = group.get('motDePasse')?.value;
    const confirmPassword = group.get('confirmMotDePasse')?.value;
    
    // If we're in edit mode and no new password is being set, don't validate
    if ((!password && !confirmPassword) || (password === '' && confirmPassword === '')) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

 loadActs(): void {
    this.loadingActs = true;
    this.actService.getAllActs().subscribe({
      next: (data) => {
        this.acts = data;
        this.loadingActs = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des ACTs';
        this.loadingActs = false;
        console.error(err);
      }
    });
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        // Remove password fields for edit mode
        const formData = {
          matricule: user.matricule,
          nomPrenom: user.nomPrenom,
          nomUtilisateur: user.nomUtilisateur,
          email: user.email,
          role: user.role,
          actif: user.actif,
          actId: user.actId,
          motDePasse: '',
          confirmMotDePasse: ''
        };
        
        this.userForm.patchValue(formData);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'utilisateur';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.userForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    // Create data object (remove confirmPassword)
    const { confirmMotDePasse, ...userData } = this.userForm.value;
    
    // If editing and no password provided, remove it from request
    if (this.isEditMode && !userData.motDePasse) {
      delete userData.motDePasse;
    }
    
    if (this.isEditMode) {
      const id = +this.route.snapshot.params['id'];
      this.userService.updateUser(id, userData).subscribe({
        next: () => {
          this.router.navigate(['/administration/users']);
        },
        error: (err) => {
          this.handleError(err);
          this.loading = false;
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.router.navigate(['/administration/users']);
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
      this.error = `Erreur lors de ${this.isEditMode ? 'la mise à jour' : 'la création'} de l'utilisateur`;
    }
    console.error(err);
  }
  
  // Getter for easy access to form controls in the template
  get f() {
    return this.userForm.controls;
  }
}