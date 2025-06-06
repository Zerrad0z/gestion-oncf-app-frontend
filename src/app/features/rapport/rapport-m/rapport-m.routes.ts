import { Routes } from '@angular/router';

export const RAPPORT_ROUTES: Routes = [
  
  // Rapport M routes - these will be accessible at /rapport/rapport-m
  {
    path: 'rapport-m',
    loadComponent: () => import('./rapport-m-list/rapport-m-list.component')
      .then(m => m.RapportMListComponent)
  },
  {
    path: 'rapport-m/create',
    loadComponent: () => import('./rapport-m-form/rapport-m-form.component')
      .then(m => m.RapportMFormComponent)
  },
  {
    path: 'rapport-m/edit/:id',
    loadComponent: () => import('./rapport-m-form/rapport-m-form.component')
      .then(m => m.RapportMFormComponent)
  },
  {
    path: 'rapport-m/:id',
    loadComponent: () => import('./rapport-m-detail/rapport-m-detail.component')
      .then(m => m.RapportMDetailComponent)
  },
  
  // Default route - redirect to rapport-m list
  {
    path: '',
    redirectTo: 'rapport-m',
    pathMatch: 'full'
  }
];