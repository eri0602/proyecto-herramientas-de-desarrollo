import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 3rem; color: white; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #050c18; min-height: 100vh;">
      <a routerLink="/dashboard" style="color: #fbbf24; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 2rem;">
        <i class="bi bi-arrow-left"></i> Volver al Dashboard
      </a>
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">Mis Metas</h1>
      <p style="color: #94a3b8; font-size: 1.1rem; max-width: 600px;">
        Define objetivos claros como "Correr 15 km esta semana" o "3 sesiones de HIIT".
        Las metas te mantienen enfocado y motivado.
      </p>
      
      <div style="margin-top: 2rem; padding: 2rem; background: rgba(15,23,42,0.8); border-radius: 1rem; border: 1px dashed rgba(255,255,255,0.2); text-align: center; color: #64748b;">
        <i class="bi bi-trophy" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        Próximamente: Gestor de metas semanales y mensuales
      </div>
    </div>
  `
})
export class MetasComponent {}
