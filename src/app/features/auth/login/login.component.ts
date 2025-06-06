import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  submitAttempted = false;
  returnUrl: string = '/dashboard';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      nomUtilisateur: ['', [Validators.required, Validators.minLength(3)]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.error = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const loginRequest: LoginRequest = this.loginForm.value;

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.loading = false;
        // Navigate to return URL or dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private handleError(err: any): void {
    if (err.error && err.error.message) {
      this.error = err.error.message;
    } else if (err.status === 401) {
      this.error = 'Nom d\'utilisateur ou mot de passe incorrect';
    } else if (err.status === 0) {
      this.error = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.';
    } else {
      this.error = 'Une erreur est survenue lors de la connexion';
    }
    console.error('Login error:', err);
  }

  // Getter for easy access to form controls in template
  get f() {
    return this.loginForm.controls;
  }
}