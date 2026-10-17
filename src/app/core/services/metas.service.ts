import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Meta } from '../models/meta.model';

const STORAGE_KEY = 'resiste_metas';

@Injectable({
  providedIn: 'root'
})
export class MetasService {
  private supabase = inject(SupabaseService).supabase;

  private getLocalMetas(): Meta[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLocalMetas(metas: Meta[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
  }

  async getMetaActual(usuarioId: string): Promise<Meta | null> {
    try {
      const { data, error } = await this.supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || this.getLocalMeta(usuarioId);
    } catch {
      return this.getLocalMeta(usuarioId);
    }
  }

  private getLocalMeta(usuarioId: string): Meta | null {
    const metas = this.getLocalMetas();
    return metas.find(m => m.usuario_id === usuarioId) || null;
  }

  async createMeta(meta: Omit<Meta, 'id'>): Promise<Meta> {
    try {
      const { data, error } = await this.supabase
        .from('metas')
        .insert(meta)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const nuevaMeta: Meta = { ...meta, id: `local_${Date.now()}` };
      const metas = this.getLocalMetas();
      const existingIdx = metas.findIndex(m => m.usuario_id === meta.usuario_id);
      if (existingIdx >= 0) {
        metas[existingIdx] = nuevaMeta;
      } else {
        metas.push(nuevaMeta);
      }
      this.saveLocalMetas(metas);
      return nuevaMeta;
    }
  }

  async updateMeta(id: string, cambios: Partial<Meta>): Promise<Meta> {
    try {
      const { data, error } = await this.supabase
        .from('metas')
        .update(cambios)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const metas = this.getLocalMetas();
      const idx = metas.findIndex(m => m.id === id);
      if (idx >= 0) {
        metas[idx] = { ...metas[idx], ...cambios };
        this.saveLocalMetas(metas);
        return metas[idx];
      }
      throw new Error('Meta no encontrada');
    }
  }
}
