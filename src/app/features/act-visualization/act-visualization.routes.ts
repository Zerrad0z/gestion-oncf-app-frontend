// src/app/features/act-visualization/act-visualization.routes.ts
import { Routes } from '@angular/router';

export const ACT_VISUALIZATION_ROUTES: Routes = [
  {
    path: 'overview',
    loadComponent: () => import('./act-overview/act-overview.component')
      .then(m => m.ActOverviewComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('./act-detail/act-detail.component')
      .then(m => m.ActDetailComponent)
  },
  
  // Default route
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  }
];