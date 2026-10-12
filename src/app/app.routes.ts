import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'sesiones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sesiones/sesiones.component').then((m) => m.SesionesComponent)
  },
  {
    path: 'metas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/metas/metas.component').then((m) => m.MetasComponent)
  },
  {
    path: 'tipos-actividad',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tipos-actividad/tipos-actividad.component').then((m) => m.TiposActividadComponent)
  },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' }
];
