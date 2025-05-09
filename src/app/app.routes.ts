import { Routes } from '@angular/router';
import { CONFIGURATION_ROUTES } from './features/configuration/configuration.routes';

export const routes: Routes = [
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'configuration',
    children: CONFIGURATION_ROUTES
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];