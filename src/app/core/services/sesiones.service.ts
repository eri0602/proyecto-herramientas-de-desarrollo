import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Sesion } from '../models/sesion.model';

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private supabase = inject(SupabaseService).supabase;

  async getSesiones(usuarioId: string): Promise<Sesion[]> {
    const { data, error } = await this.supabase
      .from('sesiones')
      .select('*, tipos_actividad(*)')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSesion(sesion: Omit<Sesion, 'id'>): Promise<Sesion> {
    const { data, error } = await this.supabase
      .from('sesiones')
      .insert(sesion)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSesion(id: string, sesion: Partial<Sesion>): Promise<Sesion> {
    const { data, error } = await this.supabase
      .from('sesiones')
      .update(sesion)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSesion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('sesiones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
