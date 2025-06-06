import { Routes } from '@angular/router';

export const LETTRE_SOMMATION_ROUTES: Routes = [
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
  
  // Carte routes with debugging
  {
    path: 'carte',
    loadComponent: () => {
      console.log('Loading carte list component...');
      return import('./lettre-sommation-carte-list/lettre-sommation-carte-list.component')
        .then(m => {
          console.log('Carte list component loaded successfully');
          return m.LettreSommationCarteListComponent;
        })
        .catch(error => {
          console.error('Failed to load carte list component:', error);
          throw error;
        });
    }
  },
  {
  path: 'carte/create',
  loadComponent: () => {
    console.log('🔍 Attempting to load form component...');
    console.log('📁 Current working directory:', window.location.origin);
    console.log('📁 Trying to import from: ./lettre-sommation-carte-form/lettre-sommation-carte-form.component');
    
    return import('./lettre-sommation-carte-form/lettre-sommation-carte-form.component')
      .then(m => {
        console.log('✅ Import successful!', m);
        console.log('🎯 Component:', m.LettreSommationCarteFormComponent);
        return m.LettreSommationCarteFormComponent;
      })
      .catch(error => {
        console.error('❌ Import FAILED:', error);
        console.error('📁 Check if this file exists: src/app/features/lettre-sommation/lettre-sommation-carte-form/lettre-sommation-carte-form.component.ts');
        throw error;
      });
  }
},
  {
    path: 'carte/edit/:id',
    loadComponent: () => {
      console.log('Loading carte form component for EDIT...');
      return import('./lettre-sommation-carte-form/lettre-sommation-carte-form.component')
        .then(m => {
          console.log('Carte form component loaded successfully for edit');
          return m.LettreSommationCarteFormComponent;
        })
        .catch(error => {
          console.error('Failed to load carte form component for edit:', error);
          throw error;
        });
    }
  },
  {
    path: 'carte/:id',
    loadComponent: () => import('./lettre-sommation-carte-detail/lettre-sommation-carte-detail.component')
      .then(m => m.LettreSommationCarteDetailComponent)
  },
  
  // Default route
  {
    path: '',
    redirectTo: 'billet',
    pathMatch: 'full'
  }
];