import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Sesion } from '../models/sesion.model';
import { TipoActividad } from '../models/tipo-actividad.model';

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
<<<<<<< Updated upstream
=======

    // Modo Local / Demo
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const tipos: TipoActividad[] = await this.tiposActividadService.getTiposActividad();
    const tiposMap = new Map<string, TipoActividad>(tipos.map((t: TipoActividad) => [t.id, t]));

    const userSesiones: Sesion[] = list
      .filter((s: Sesion) => s.usuario_id === usuarioId)
      .map((s: Sesion) => ({
        ...s,
        tipos_actividad: s.tipo_actividad_id ? tiposMap.get(s.tipo_actividad_id) : undefined
      }))
      .sort((a: Sesion, b: Sesion) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return userSesiones;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const nueva: Sesion = {
      ...sesion,
      id: 'ses_' + Date.now()
    };
    list.push(nueva);
    localStorage.setItem('resiste_sesiones', JSON.stringify(list));

    const tipos: TipoActividad[] = await this.tiposActividadService.getTiposActividad();
    const tipo = tipos.find((t: TipoActividad) => t.id === nueva.tipo_actividad_id);
    return { ...nueva, tipos_actividad: tipo };
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex((s: Sesion) => s.id === id);
    if (idx === -1) throw new Error('Sesión no encontrada.');

    list[idx] = { ...list[idx], ...sesion };
    localStorage.setItem('resiste_sesiones', JSON.stringify(list));

    const tipos: TipoActividad[] = await this.tiposActividadService.getTiposActividad();
    const tipo = tipos.find((t: TipoActividad) => t.id === list[idx].tipo_actividad_id);
    return { ...list[idx], tipos_actividad: tipo };
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

    // Modo Local
    const stored = localStorage.getItem('resiste_sesiones');
    const list: Sesion[] = stored ? JSON.parse(stored) : [];
    const updated = list.filter((s: Sesion) => s.id !== id);
    localStorage.setItem('resiste_sesiones', JSON.stringify(updated));
>>>>>>> Stashed changes
  }
}
