import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TipoActividad } from '../models/tipo-actividad.model';

const DEFAULT_ACTIVIDADES: TipoActividad[] = [
  { id: 'act_1', nombre: 'Carrera continua' },
  { id: 'act_2', nombre: 'Ciclismo de ruta' },
  { id: 'act_3', nombre: 'Natación' },
  { id: 'act_4', nombre: 'Entrenamiento por intervalos (HIIT)' },
  { id: 'act_5', nombre: 'Caminata rápida' },
  { id: 'act_6', nombre: 'Fuerza / Resistencia muscular' }
];

@Injectable({
  providedIn: 'root'
})
export class TiposActividadService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.supabase;

  async getTiposActividad(): Promise<TipoActividad[]> {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase
        .from('tipos_actividad')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    }

    // Modo Local / Demo
    const stored = localStorage.getItem('resiste_tipos_actividad');
    if (!stored) {
      localStorage.setItem('resiste_tipos_actividad', JSON.stringify(DEFAULT_ACTIVIDADES));
      return DEFAULT_ACTIVIDADES;
    }
    return JSON.parse(stored);
  }

  async createTipoActividad(tipo: Omit<TipoActividad, 'id'>): Promise<TipoActividad> {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase
        .from('tipos_actividad')
        .insert(tipo)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Modo Local
    const list = await this.getTiposActividad();
    const exists = list.some(t => t.nombre.toLowerCase().trim() === tipo.nombre.toLowerCase().trim());
    if (exists) {
      throw new Error(`El tipo de actividad "${tipo.nombre}" ya existe.`);
    }

    const nuevo: TipoActividad = {
      id: 'act_' + Date.now(),
      nombre: tipo.nombre.trim()
    };
    list.push(nuevo);
    localStorage.setItem('resiste_tipos_actividad', JSON.stringify(list));
    return nuevo;
  }

  async deleteTipoActividad(id: string): Promise<void> {
    if (this.supabaseService.isConfigured) {
      const { error } = await this.supabase
        .from('tipos_actividad')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return;
    }

    // Modo Local
    const list = await this.getTiposActividad();
    const updated = list.filter(t => t.id !== id);
    localStorage.setItem('resiste_tipos_actividad', JSON.stringify(updated));
  }
}
