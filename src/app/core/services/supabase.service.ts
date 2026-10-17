import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    try {
      this.client = createClient(environment.supabaseUrl, environment.supabaseKey);
    } catch (e) {
      console.warn('Aviso: Supabase Client no pudo inicializarse con la clave configurada:', e);
      // Fallback seguro con token anónimo genérico para evitar que la aplicación crashee
      this.client = createClient(
        environment.supabaseUrl || 'https://placeholder.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjUwMDAwMDAwMH0.placeholder'
      );
    }
  }

  get supabase(): SupabaseClient {
    return this.client;
  }
}
