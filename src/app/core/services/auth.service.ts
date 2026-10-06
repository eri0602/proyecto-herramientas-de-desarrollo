import { Injectable, inject, signal, computed } from '@angular/core';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.supabase;

  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<Usuario | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    if (this.supabaseService.isConfigured) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
          this.currentUser.set(session.user);
          await this.loadUserProfile(session.user.id);
        }

        this.supabase.auth.onAuthStateChange(async (event, session) => {
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
    }
  }

  async loadUserProfile(userId: string): Promise<Usuario | null> {
    if (!this.supabaseService.isConfigured) {
      return this.currentProfile();
    }

    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('No se pudo cargar el perfil de usuario:', error.message);
      return null;
    }

    this.currentProfile.set(data);
    return data;
  }

  async signUp(email: string, password: string, nombre: string) {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await this.supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            nombre: nombre,
            rol: 'usuario'
          });

        if (profileError) {
          console.error('Error al crear perfil en la tabla usuarios:', profileError.message);
        }
      }

      return data;
    }

    // Modo Local / Demo para registro inmediato
    const usersRaw = localStorage.getItem('resiste_registered_users');
    const users: Array<any> = usersRaw ? JSON.parse(usersRaw) : [];

    const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Ya existe una cuenta con este correo electrónico.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      email: email,
      password: password,
      user_metadata: { nombre },
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('resiste_registered_users', JSON.stringify(users));

    // Guardar sesión activa
    localStorage.setItem('resiste_session', JSON.stringify(newUser));
    this.currentUser.set(newUser as unknown as User);
    this.currentProfile.set({
      id: newUser.id,
      nombre: nombre,
      rol: 'usuario',
      created_at: newUser.created_at
    });

    return { user: newUser };
  }

  async signIn(email: string, password: string) {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (data.user) {
        this.currentUser.set(data.user);
        await this.loadUserProfile(data.user.id);
      }
      return data;
    }

    // Modo Local / Demo
    const usersRaw = localStorage.getItem('resiste_registered_users');
    const users: Array<any> = usersRaw ? JSON.parse(usersRaw) : [];

    const user = users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    localStorage.setItem('resiste_session', JSON.stringify(user));
    this.currentUser.set(user as unknown as User);
    this.currentProfile.set({
      id: user.id,
      nombre: user.user_metadata?.nombre || user.email.split('@')[0],
      rol: 'usuario',
      created_at: user.created_at
    });

    return { user };
  }

  async signOut() {
    if (this.supabaseService.isConfigured) {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    }
    localStorage.removeItem('resiste_session');
    this.currentUser.set(null);
    this.currentProfile.set(null);
  }
}
