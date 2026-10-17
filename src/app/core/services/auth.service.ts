import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

const DEMO_STORAGE_KEY = 'resiste_demo_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).supabase;
  private router = inject(Router);

  currentUser = signal<any>(null);

  constructor() {
    // Restaurar usuario demo si existe en almacenamiento local
    const demoUser = localStorage.getItem(DEMO_STORAGE_KEY);
    if (demoUser) {
      try {
        this.currentUser.set(JSON.parse(demoUser));
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    // Inicializar sesión desde Supabase
    try {
      this.supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          this.currentUser.set(data.session.user);
          localStorage.removeItem(DEMO_STORAGE_KEY);
        }
      }).catch(() => {
        // Modo offline / demo
      });
    } catch {
      // ignore
    }

    // Escuchar cambios de auth
    try {
      this.supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.currentUser.set(session.user);
          localStorage.removeItem(DEMO_STORAGE_KEY);
        }
      });
    } catch {
      // ignore
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  loginDemo() {
    const usuarioDemo = {
      id: 'demo-user',
      email: 'demo@resiste.app',
      user_metadata: { nombre: 'Atleta Demo' }
    };
    this.currentUser.set(usuarioDemo);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(usuarioDemo));
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.removeItem(DEMO_STORAGE_KEY);
    return data;
  }

  async register(email: string, password: string, nombre: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    try {
      await this.supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem(DEMO_STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }
}
