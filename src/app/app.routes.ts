import { Routes } from '@angular/router';
import { CONFIGURATION_ROUTES } from './features/configuration/configuration.routes';
import { ADMINISTRATION_ROUTES } from './features/administration/administration.routes';
import { LETTRE_SOMMATION_ROUTES } from './features/lettre-sommation/lettre-sommation.routes';

export const routes: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  
  // Include the LETTRE_SOMMATION_ROUTES directly
  ...LETTRE_SOMMATION_ROUTES,
  
  { 
    path: 'configuration',
    children: CONFIGURATION_ROUTES
  },
  
  {
    path: 'administration',
    children: ADMINISTRATION_ROUTES
  },
  
  // Default route
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  
  // Wildcard route MUST be last
  { path: '**', redirectTo: 'dashboard' }
];