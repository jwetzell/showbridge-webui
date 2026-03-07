import { Routes } from '@angular/router';
import { App } from './app';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'config',
    pathMatch: 'full',
  },
  {
    path: 'config',
    loadComponent: () => import('./components/config/config.component').then((m) => m.ConfigComponent),
  },
];
