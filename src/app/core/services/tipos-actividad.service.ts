import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TipoActividad } from '../models/tipo-actividad.model';

@Injectable({
  providedIn: 'root'
})
export class TiposActividadService {
  private supabase = inject(SupabaseService).supabase;

  async getTiposActividad(): Promise<TipoActividad[]> {
    const { data, error } = await this.supabase
      .from('tipos_actividad')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createTipoActividad(tipo: Omit<TipoActividad, 'id'>): Promise<TipoActividad> {
    const { data, error } = await this.supabase
      .from('tipos_actividad')
      .insert(tipo)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
