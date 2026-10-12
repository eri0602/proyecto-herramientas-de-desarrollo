import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // En modo demo (sin Supabase configurado), permitir acceso directo
  // El guard verifica si hay un usuario autenticado en memoria
  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login si no hay sesión activa
  return router.createUrlTree(['/login']);
};
