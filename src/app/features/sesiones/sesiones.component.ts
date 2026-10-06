import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 3rem; color: white; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #050c18; min-height: 100vh;">
      <a routerLink="/dashboard" style="color: #38bdf8; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 2rem;">
        <i class="bi bi-arrow-left"></i> Volver al Dashboard
      </a>
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">Mis Sesiones</h1>
      <p style="color: #94a3b8; font-size: 1.1rem; max-width: 600px;">
        Aquí podrás registrar y ver el historial de todos tus entrenamientos, 
        evaluar tu esfuerzo percibido y llevar un control de tu constancia.
      </p>
      
      <div style="margin-top: 2rem; padding: 2rem; background: rgba(15,23,42,0.8); border-radius: 1rem; border: 1px dashed rgba(255,255,255,0.2); text-align: center; color: #64748b;">
        <i class="bi bi-play-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        Próximamente: Formulario para registrar sesiones
      </div>
    </div>
  `
})
export class SesionesComponent {}
