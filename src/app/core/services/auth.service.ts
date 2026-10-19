<<<<<<< Updated upstream
import { Injectable, inject, signal } from '@angular/core';
=======
import { Injectable, inject, signal, computed } from '@angular/core';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      });
    } catch {
      // ignore
=======

        this.supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
          if (session?.user) {
            this.currentUser.set(session.user);
            await this.loadUserProfile(session.user.id);
          } else {
            this.currentUser.set(null);
            this.currentProfile.set(null);
          }
        });
      } catch (err) {
        console.warn('Supabase no configurado o sin conexión:', err);
      }
    } else {
      // Modo Local / Demo para presentación
      const sessionData = localStorage.getItem('resiste_session');
      if (sessionData) {
        try {
          const user = JSON.parse(sessionData);
          this.currentUser.set(user as User);
          this.currentProfile.set({
            id: user.id,
            nombre: user.user_metadata?.nombre || user.email.split('@')[0],
            rol: 'usuario'
          });
        } catch {
          localStorage.removeItem('resiste_session');
        }
      }
>>>>>>> Stashed changes
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
