import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="app-navbar">
      <div class="nav-container">
        <!-- Brand -->
        <a routerLink="/dashboard" (click)="cerrarMenu()" class="brand">
          <span class="brand-icon"><i class="bi bi-activity"></i></span>
          <span class="brand-name">Resiste</span>
        </a>

        <!-- Desktop Navigation Links -->
        <div class="nav-desktop">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/sesiones"
            routerLinkActive="active"
            class="nav-link"
          >
            <i class="bi bi-stopwatch-fill"></i>
            <span>Sesiones</span>
          </a>

          <a
            routerLink="/tipos-actividad"
            routerLinkActive="active"
            class="nav-link"
          >
            <i class="bi bi-tags-fill"></i>
            <span>Actividades</span>
          </a>

          <a
            routerLink="/metas"
            routerLinkActive="active"
            class="nav-link"
          >
            <i class="bi bi-bullseye"></i>
            <span>Mi Meta</span>
          </a>

          <button class="nav-link btn-logout" (click)="logout()" title="Cerrar sesión">
            <i class="bi bi-box-arrow-right"></i>
            <span>Salir</span>
          </button>
        </div>

        <!-- Mobile Menu Toggle Button -->
        <button
          class="btn-toggle-menu"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuAbierto()"
          aria-label="Abrir menú de navegación"
        >
          <i class="bi" [class.bi-list]="!menuAbierto()" [class.bi-x-lg]="menuAbierto()"></i>
        </button>
      </div>

      <!-- Mobile Dropdown Navigation -->
      @if (menuAbierto()) {
        <div class="nav-mobile-dropdown">
          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="cerrarMenu()"
            class="mobile-nav-link"
          >
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/sesiones"
            routerLinkActive="active"
            (click)="cerrarMenu()"
            class="mobile-nav-link"
          >
            <i class="bi bi-stopwatch-fill"></i>
            <span>Sesiones</span>
          </a>

          <a
            routerLink="/tipos-actividad"
            routerLinkActive="active"
            (click)="cerrarMenu()"
            class="mobile-nav-link"
          >
            <i class="bi bi-tags-fill"></i>
            <span>Actividades</span>
          </a>

          <a
            routerLink="/metas"
            routerLinkActive="active"
            (click)="cerrarMenu()"
            class="mobile-nav-link"
          >
            <i class="bi bi-bullseye"></i>
            <span>Mi Meta</span>
          </a>

          <button class="mobile-nav-link btn-mobile-logout" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      }
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .app-navbar {
      background: #0b0b14;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .nav-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0.85rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    /* Brand */
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      user-select: none;
    }

    .brand-icon {
      font-size: 1.5rem;
      color: #38bdf8;
      display: flex;
      align-items: center;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    /* Desktop Navigation */
    .nav-desktop {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #94a3b8;
      text-decoration: none;
      padding: 0.5rem 0.95rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-link i {
      font-size: 1rem;
    }

    .nav-link:hover {
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border-color: rgba(56, 189, 248, 0.25);
    }

    .btn-logout {
      color: #f87171 !important;
      background: rgba(248, 113, 113, 0.06) !important;
      border-color: rgba(248, 113, 113, 0.15) !important;
      margin-left: 0.5rem;
    }

    .btn-logout:hover {
      background: rgba(248, 113, 113, 0.16) !important;
      color: #fca5a5 !important;
      border-color: rgba(248, 113, 113, 0.3) !important;
    }

    /* Mobile toggle */
    .btn-toggle-menu {
      display: none;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      font-size: 1.35rem;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .btn-toggle-menu:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Mobile Dropdown */
    .nav-mobile-dropdown {
      display: none;
      flex-direction: column;
      padding: 0.75rem 1.25rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background: #0b0b14;
      gap: 0.5rem;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #94a3b8;
      text-decoration: none;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      width: 100%;
      text-align: left;
      cursor: pointer;
    }

    .mobile-nav-link i {
      font-size: 1.15rem;
    }

    .mobile-nav-link:hover {
      color: #f1f5f9;
      background: rgba(255, 255, 255, 0.07);
    }

    .mobile-nav-link.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border-color: rgba(56, 189, 248, 0.3);
    }

    .btn-mobile-logout {
      color: #f87171 !important;
      background: rgba(248, 113, 113, 0.08) !important;
      border-color: rgba(248, 113, 113, 0.2) !important;
      margin-top: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 820px) {
      .nav-desktop {
        display: none;
      }
      .btn-toggle-menu {
        display: flex;
      }
      .nav-mobile-dropdown {
        display: flex;
      }
      .nav-container {
        padding: 0.75rem 1.25rem;
      }
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);

  menuAbierto = signal(false);

  toggleMenu() {
    this.menuAbierto.update(v => !v);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  logout() {
    this.cerrarMenu();
    this.authService.logout();
  }
}
