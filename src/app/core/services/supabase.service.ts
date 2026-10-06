import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient;
  readonly isConfigured: boolean;

  constructor() {
    const isReal = environment.supabaseUrl &&
      (environment.supabaseUrl.startsWith('http://') || environment.supabaseUrl.startsWith('https://')) &&
      !environment.supabaseUrl.includes('YOUR_SUPABASE_URL') &&
      !environment.supabaseUrl.includes('dummy-project');

    this.isConfigured = !!isReal;
    const url = isReal ? environment.supabaseUrl : 'https://dummy-project.supabase.co';
    const key = (isReal && environment.supabaseKey && environment.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY') ? environment.supabaseKey : 'dummy-anon-key';
    this.client = createClient(url, key);
  }

  get supabase(): SupabaseClient {
    return this.client;
  }
}
