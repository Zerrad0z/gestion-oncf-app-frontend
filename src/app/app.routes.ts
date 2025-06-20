import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { CONFIGURATION_ROUTES } from './features/configuration/configuration.routes';
import { ADMINISTRATION_ROUTES } from './features/administration/administration.routes';
import { LETTRE_SOMMATION_ROUTES } from './features/lettre-sommation/lettre-sommation.routes';
import { RAPPORT_ROUTES } from './features/rapport/rapport-m/rapport-m.routes';
import { ACT_VISUALIZATION_ROUTES } from './features/act-visualization/act-visualization.routes';

export const routes: Routes = [
  // Auth routes (accessible only when not logged in)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [NoAuthGuard]
  },
  
  // Unauthorized access page
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  
  // Dashboard (protected route)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  
  //  ACT Visualization routes - Accessible by ENCADRANT, SUPERVISEUR, and ADMIN
  {
    path: 'act-visualization',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ENCADRANT', 'SUPERVISEUR', 'ADMIN'] }, 
    children: ACT_VISUALIZATION_ROUTES
  },
  
  // Alternative shorter routes for easier navigation
  {
    path: 'acts',
    redirectTo: 'act-visualization/overview',
    pathMatch: 'full'
  },
  {
    path: 'act-overview',
    redirectTo: 'act-visualization/overview',
    pathMatch: 'full'
  },
  {
    path: 'act-detail/:id',
    redirectTo: 'act-visualization/detail/:id',
    pathMatch: 'full'
  },
  
  // Protected feature routes - all authenticated users can access
  {
    path: 'lettre-sommation',
    canActivate: [AuthGuard],
    children: LETTRE_SOMMATION_ROUTES
  },
  
  {
    path: 'rapport',
    canActivate: [AuthGuard],
    children: RAPPORT_ROUTES
  },
  
  // Configuration routes (Admin and Superviseur only)
  { 
    path: 'configuration',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SUPERVISEUR'] },
    children: CONFIGURATION_ROUTES
  },
  
  // Administration routes (Admin and Superviseur only)
  {
    path: 'administration',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'SUPERVISEUR'] },
    children: ADMINISTRATION_ROUTES
  },
  
  // Default route
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  
  // Wildcard route MUST be last
  { path: '**', redirectTo: 'dashboard' }
];