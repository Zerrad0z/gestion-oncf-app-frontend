import { Routes } from '@angular/router';

export const CONFIGURATION_ROUTES: Routes = [
  {
    path: 'sections',
    loadComponent: () => import('./sections/section-list/section-list.component').then(m => m.SectionListComponent)
  },
  {
    path: 'sections/new',
    loadComponent: () => import('./sections/section-form/section-form.component').then(m => m.SectionFormComponent)
  },
  {
    path: 'sections/:id',
    loadComponent: () => import('./sections/section-form/section-form.component').then(m => m.SectionFormComponent)
  },
  {
    path: 'antennes',
    loadComponent: () => import('./antennes/antenne-list/antenne-list.component').then(m => m.AntenneListComponent)
  },
  {
    path: 'antennes/new',
    loadComponent: () => import('./antennes/antenne-form/antenne-form.component').then(m => m.AntenneFormComponent)
  },
  {
    path: 'antennes/:id',
    loadComponent: () => import('./antennes/antenne-form/antenne-form.component').then(m => m.AntenneFormComponent)
  }
];