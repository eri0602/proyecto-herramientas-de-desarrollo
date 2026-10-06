import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TiposActividadService } from './tipos-actividad.service';
import { Sesion } from '../models/sesion.model';

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private supabaseService = inject(SupabaseService);
  private tiposActividadService = inject(TiposActividadService);
  private supabase = this.supabaseService.supabase;

  async getSesiones(usuarioId: string): Promise<Sesion[]> {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase
        .from('sesiones')
        .select('*, tipos_actividad(*)')
        .eq('usuario_id', usuarioId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // Modo Local / Demo
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const tipos = await this.tiposActividadService.getTiposActividad();
    const tiposMap = new Map(tipos.map(t => [t.id, t]));

    const userSesiones = list
      .filter(s => s.usuario_id === usuarioId)
      .map(s => ({
        ...s,
        tipos_actividad: s.tipo_actividad_id ? tiposMap.get(s.tipo_actividad_id) : undefined
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return userSesiones;
  }

  async createSesion(sesion: Omit<Sesion, 'id'>): Promise<Sesion> {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase
        .from('sesiones')
        .insert(sesion)
        .select('*, tipos_actividad(*)')
        .single();

      if (error) throw error;
      return data;
    }

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const nueva: Sesion = {
      ...sesion,
      id: 'ses_' + Date.now()
    };
    list.push(nueva);
    localStorage.setItem('resiste_sesiones', JSON.stringify(list));

    const tipos = await this.tiposActividadService.getTiposActividad();
    const tipo = tipos.find(t => t.id === nueva.tipo_actividad_id);
    return { ...nueva, tipos_actividad: tipo };
  }

  async updateSesion(id: string, sesion: Partial<Sesion>): Promise<Sesion> {
    if (this.supabaseService.isConfigured) {
      const { data, error } = await this.supabase
        .from('sesiones')
        .update(sesion)
        .eq('id', id)
        .select('*, tipos_actividad(*)')
        .single();

      if (error) throw error;
      return data;
    }

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Sesión no encontrada.');

    list[idx] = { ...list[idx], ...sesion };
    localStorage.setItem('resiste_sesiones', JSON.stringify(list));

    const tipos = await this.tiposActividadService.getTiposActividad();
    const tipo = tipos.find(t => t.id === list[idx].tipo_actividad_id);
    return { ...list[idx], tipos_actividad: tipo };
  }

  async deleteSesion(id: string): Promise<void> {
    if (this.supabaseService.isConfigured) {
      const { error } = await this.supabase
        .from('sesiones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return;
    }

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const updated = list.filter(s => s.id !== id);
    localStorage.setItem('resiste_sesiones', JSON.stringify(updated));
  }
}
