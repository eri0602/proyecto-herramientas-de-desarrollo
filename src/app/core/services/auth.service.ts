import { Injectable, inject, signal, computed } from '@angular/core';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).supabase;

  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<Usuario | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
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
  }

  async loadUserProfile(userId: string): Promise<Usuario | null> {
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
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Insertar en la tabla usuarios de Supabase
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

  async signIn(email: string, password: string) {
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

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.currentUser.set(null);
    this.currentProfile.set(null);
  }
}
