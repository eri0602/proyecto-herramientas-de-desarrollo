import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Sesion } from '../models/sesion.model';

const STORAGE_KEY = 'resiste_sesiones';

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private supabase = inject(SupabaseService).supabase;

  // Fallback local
  private getLocalSesiones(): Sesion[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLocalSesiones(sesiones: Sesion[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
  }

  async getSesiones(usuarioId: string): Promise<Sesion[]> {
    try {
      const { data, error } = await this.supabase
        .from('sesiones')
        .select('*, tipos_actividad(*)')
        .eq('usuario_id', usuarioId)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      return this.getLocalSesiones();
    }
  }

  async createSesion(sesion: Omit<Sesion, 'id'>): Promise<Sesion> {
    try {
      const { data, error } = await this.supabase
        .from('sesiones')
        .insert(sesion)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const nuevaSesion: Sesion = { ...sesion, id: `local_${Date.now()}` };
      const sesiones = this.getLocalSesiones();
      sesiones.unshift(nuevaSesion);
      this.saveLocalSesiones(sesiones);
      return nuevaSesion;
    }
  }

  async updateSesion(id: string, cambios: Partial<Sesion>): Promise<Sesion> {
    try {
      const { data, error } = await this.supabase
        .from('sesiones')
        .update(cambios)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const sesiones = this.getLocalSesiones();
      const idx = sesiones.findIndex(s => s.id === id);
      if (idx >= 0) {
        sesiones[idx] = { ...sesiones[idx], ...cambios };
        this.saveLocalSesiones(sesiones);
        return sesiones[idx];
      }
      throw new Error('Sesión no encontrada');
    }
  }

  async deleteSesion(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('sesiones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch {
      const sesiones = this.getLocalSesiones().filter(s => s.id !== id);
      this.saveLocalSesiones(sesiones);
    }
  }
}
