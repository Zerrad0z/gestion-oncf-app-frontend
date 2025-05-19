import { Routes } from '@angular/router';
import { SectionListComponent } from './sections/section-list/section-list.component';
import { SectionFormComponent } from './sections/section-form/section-form.component';
import { AntenneListComponent } from './antennes/antenne-list/antenne-list.component';
import { AntenneFormComponent } from './antennes/antenne-form/antenne-form.component';
import { TrainListComponent } from './trains/train-list/train-list.component';
import { TrainFormComponent } from './trains/train-form/train-form.component';
import { GareListComponent } from './gares/gare-list/gare-list.component';
import { GareFormComponent } from './gares/gare-form/gare-form.component';

export const CONFIGURATION_ROUTES: Routes = [
  // Root path for configuration to avoid redirection issues
  { path: '', redirectTo: 'sections', pathMatch: 'full' },
  
  // Section routes
  {
    path: 'sections',
    component: SectionListComponent
  },
  {
    path: 'sections/new',
    component: SectionFormComponent
  },
  {
    path: 'sections/:id/edit',
    component: SectionFormComponent
  },
  
  // Antenne routes
  {
    path: 'antennes',
    component: AntenneListComponent
  },
  {
    path: 'antennes/new',
    component: AntenneFormComponent
  },
  {
    path: 'antennes/:id/edit',
    component: AntenneFormComponent
  },
  
  // Train routes
  {
    path: 'trains',
    component: TrainListComponent
  },
  {
    path: 'trains/new',
    component: TrainFormComponent
  },
  {
    path: 'trains/:id/edit',
    component: TrainFormComponent
  },
  
  // Gare routes
  {
    path: 'gares',
    component: GareListComponent
  },
  {
    path: 'gares/new',
    component: GareFormComponent
  },
  {
    path: 'gares/:id/edit',
    component: GareFormComponent
  },
  // ACT routes
  { 
    path: 'agents', 
    loadComponent: () => import('./acts/act-list/act-list.component').then(m => m.ActListComponent) 
  },
  { 
    path: 'agents/:id', 
    loadComponent: () => import('./acts/act-form/act-form.component').then(m => m.ActFormComponent) 
  },
];