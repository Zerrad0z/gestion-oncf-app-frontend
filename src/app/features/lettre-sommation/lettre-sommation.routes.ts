import { Routes } from '@angular/router';

export const LETTRE_SOMMATION_ROUTES: Routes = [
  {
    path: 'lettres-sommation',
    children: [
      // Billet routes
      {
        path: 'billet',
        loadComponent: () => import('./lettre-sommation-billet-list/lettre-sommation-billet-list.component')
          .then(m => m.LettreSommationBilletListComponent)
      },
      {
        path: 'billet/create',
        loadComponent: () => import('./lettre-sommation-billet-form/lettre-sommation-billet-form.component')
          .then(m => m.LettreSommationBilletFormComponent)
      },
      {
        path: 'billet/edit/:id',
        loadComponent: () => import('./lettre-sommation-billet-form/lettre-sommation-billet-form.component')
          .then(m => m.LettreSommationBilletFormComponent)
      },
      {
        path: 'billet/:id',
        loadComponent: () => import('./lettre-sommation-billet-detail/lettre-sommation-billet-detail.component')
          .then(m => m.LettreSommationBilletDetailComponent)
      },
      
      // Carte routes - placeholder for future implementation
      {
        path: 'carte',
        loadComponent: () => import('./lettre-sommation-billet-list/lettre-sommation-billet-list.component')
          .then(m => m.LettreSommationBilletListComponent)
      },
      
      // Default route
      {
        path: '',
        redirectTo: 'billet',
        pathMatch: 'full'
      }
    ]
  }
];