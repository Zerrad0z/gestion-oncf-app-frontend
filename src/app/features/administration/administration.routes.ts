// src/app/features/administration/administration.routes.ts
import { Routes } from '@angular/router';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';
import { UserHistoryComponent } from './users/user-history/user-history.component';

export const ADMINISTRATION_ROUTES: Routes = [
  {
    path: 'users',
    component: UserListComponent
  },
  {
    path: 'users/new',
    component: UserFormComponent
  },
  {
    path: 'users/:id/edit',
    component: UserFormComponent
  },
  {
    path: 'users/:id/history',
    component: UserHistoryComponent
  }
];