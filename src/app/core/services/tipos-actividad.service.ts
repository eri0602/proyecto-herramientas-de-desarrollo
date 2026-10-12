import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TipoActividad } from '../models/tipo-actividad.model';

const STORAGE_KEY = 'resiste_tipos_actividad';

const DEFAULT_TIPOS: TipoActividad[] = [
  { id: 'default_1', nombre: 'Carrera' },
  { id: 'default_2', nombre: 'Caminata' },
  { id: 'default_3', nombre: 'Ciclismo' },
  { id: 'default_4', nombre: 'Natación' },
  { id: 'default_5', nombre: 'Funcional' }
];

@Injectable({
  providedIn: 'root'
})
export class TiposActividadService {
  private supabase = inject(SupabaseService).supabase;

  // Fallback local
  private getLocalTipos(): TipoActividad[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TIPOS));
    return DEFAULT_TIPOS;
  }

  private saveLocalTipos(tipos: TipoActividad[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tipos));
  }

  async getTiposActividad(): Promise<TipoActividad[]> {
    try {
      const { data, error } = await this.supabase
        .from('tipos_actividad')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch {
      // fallback
    }
    return this.getLocalTipos();
  }

  async createTipoActividad(tipo: Omit<TipoActividad, 'id'>): Promise<TipoActividad> {
    try {
      const { data, error } = await this.supabase
        .from('tipos_actividad')
        .insert(tipo)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      // fallback local
      const nuevoTipo: TipoActividad = {
        id: `local_${Date.now()}`,
        nombre: tipo.nombre
      };
      const tipos = this.getLocalTipos();
      tipos.push(nuevoTipo);
      this.saveLocalTipos(tipos);
      return nuevoTipo;
    }
  }

  async deleteTipoActividad(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('tipos_actividad')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch {
      // fallback local
      const tipos = this.getLocalTipos().filter(t => t.id !== id);
      this.saveLocalTipos(tipos);
    }
  }
}
