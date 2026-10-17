import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SesionesService } from '../../core/services/sesiones.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { Sesion } from '../../core/models/sesion.model';

interface SemanaStats {
  semana: string;
  horas: number;
  sesiones: number;
  esfuerzoPromedio: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private sesionesService = inject(SesionesService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }

  sesiones = signal<Sesion[]>([]);
  loading = signal(true);
  userName = signal<string>('Atleta');

  // Metas configurables (en semana 8 se conectarán con el servicio de metas)
  readonly META_HORAS_SEMANALES = 4;
  readonly META_SEMANAS = 12;

  async ngOnInit() {
    // Obtener usuario actual desde Supabase directamente
    try {
      const { data } = await this.supabaseService.supabase.auth.getSession();
      const nombre: string =
        (data.session?.user?.user_metadata?.['nombre'] as string | undefined) ?? 'Atleta';
      this.userName.set(nombre);

      const userId: string = data.session?.user?.id ?? 'demo-user';
      const sesionesData = await this.sesionesService.getSesiones(userId);
      this.sesiones.set(sesionesData && sesionesData.length > 0 ? sesionesData : this.getDemoSesiones());
    } catch {
      // fallback — datos de demo si no hay sesiones o no hay sesión activa
      this.sesiones.set(this.getDemoSesiones());
    } finally {
      this.loading.set(false);
    }
  }

  // ===== Estadísticas generales =====
  totalSesiones = computed(() => this.sesiones().length);

  totalMinutos = computed(() =>
    this.sesiones().reduce((acc, s) => acc + s.duracion_min, 0)
  );

  totalHoras = computed(() => +(this.totalMinutos() / 60).toFixed(1));

  esfuerzoPromedio = computed(() => {
    const s = this.sesiones();
    if (!s.length) return 0;
    return +(s.reduce((acc, ses) => acc + ses.esfuerzo_percibido, 0) / s.length).toFixed(1);
  });

  // ===== Semana actual =====
  horasEstaSemana = computed(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    const lunesSt = lunes.toISOString().slice(0, 10);
    const domingoSt = new Date(lunes.getTime() + 6 * 86400000).toISOString().slice(0, 10);

    const sesEsSemana = this.sesiones().filter(s => s.fecha >= lunesSt && s.fecha <= domingoSt);
    return +(sesEsSemana.reduce((acc, s) => acc + s.duracion_min, 0) / 60).toFixed(1);
  });

  progresoPorcentaje = computed(() =>
    Math.min(100, Math.round((this.horasEstaSemana() / this.META_HORAS_SEMANALES) * 100))
  );

  // ===== Racha =====
  racha = computed(() => {
    const fechas = [...new Set(this.sesiones().map(s => s.fecha))].sort((a, b) => b.localeCompare(a));
    if (!fechas.length) return 0;

    let rachaCount = 0;
    const hoy = new Date();

    for (let i = 0; i < 30; i++) {
      const dia = new Date(hoy.getTime() - i * 86400000).toISOString().slice(0, 10);
      if (fechas.includes(dia)) {
        rachaCount++;
      } else if (rachaCount > 0) {
        break;
      }
    }
    return rachaCount;
  });

  // ===== Últimas 8 semanas para el gráfico de barras =====
  ultimasSemanas = computed((): SemanaStats[] => {
    const resultado: SemanaStats[] = [];
    const hoy = new Date();

    for (let i = 7; i >= 0; i--) {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1) - i * 7);
      const domingo = new Date(lunes.getTime() + 6 * 86400000);
      const lunesSt = lunes.toISOString().slice(0, 10);
      const domingoSt = domingo.toISOString().slice(0, 10);

      const sesSemana = this.sesiones().filter(s => s.fecha >= lunesSt && s.fecha <= domingoSt);
      const horas = +(sesSemana.reduce((acc, s) => acc + s.duracion_min, 0) / 60).toFixed(1);
      const esfuerzoPromedioSem = sesSemana.length
        ? +(sesSemana.reduce((acc, s) => acc + s.esfuerzo_percibido, 0) / sesSemana.length).toFixed(1)
        : 0;

      resultado.push({
        semana: `S${8 - i}`,
        horas,
        sesiones: sesSemana.length,
        esfuerzoPromedio: esfuerzoPromedioSem
      });
    }
    return resultado;
  });

  maxHorasSemana = computed(() =>
    Math.max(...this.ultimasSemanas().map(s => s.horas), this.META_HORAS_SEMANALES)
  );

  // ===== Tendencia de esfuerzo (últimas 10 sesiones) =====
  tendenciaEsfuerzo = computed(() => {
    return [...this.sesiones()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10)
      .reverse();
  });

  readonly maxEsfuerzo = 10;

  getBarHeightPorcentaje(horas: number): number {
    return Math.min(100, (horas / this.maxHorasSemana()) * 100);
  }

  getBarColor(horas: number): string {
    if (horas >= this.META_HORAS_SEMANALES) return '#4ade80';
    if (horas >= this.META_HORAS_SEMANALES * 0.5) return '#facc15';
    return '#38bdf8';
  }

  getEsfuerzoColor(val: number): string {
    if (val <= 3) return '#4ade80';
    if (val <= 6) return '#facc15';
    if (val <= 8) return '#fb923c';
    return '#f87171';
  }

  getProgresColor(): string {
    const p = this.progresoPorcentaje();
    if (p >= 100) return '#4ade80';
    if (p >= 50) return '#facc15';
    return '#38bdf8';
  }

  // Tendencia: ¿subiendo o bajando el esfuerzo?
  tendenciaLabel = computed(() => {
    const t = this.tendenciaEsfuerzo();
    if (t.length < 3) return null;
    const recientes = t.slice(-3);
    const antiguas = t.slice(0, 3);
    const promedioReciente = recientes.reduce((a, s) => a + s.esfuerzo_percibido, 0) / 3;
    const promedioAntiguo = antiguas.reduce((a, s) => a + s.esfuerzo_percibido, 0) / 3;
    const diff = promedioReciente - promedioAntiguo;
    if (diff > 0.5) return { texto: '↑ Aumentando intensidad', color: '#f87171' };
    if (diff < -0.5) return { texto: '↓ Recuperando energía', color: '#4ade80' };
    return { texto: '→ Intensidad estable', color: '#facc15' };
  });

  getUserName(): string {
    return this.userName();
  }

  // ===== Helpers para racha semanal =====
  isDiaConSesion(offsetDesdeLunes: number): boolean {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    const dia = new Date(lunes.getTime() + offsetDesdeLunes * 86400000);
    const diaSt = dia.toISOString().slice(0, 10);
    return this.sesiones().some(s => s.fecha === diaSt);
  }

  getDiaLabel(offsetDesdeLunes: number): string {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    const dia = new Date(lunes.getTime() + offsetDesdeLunes * 86400000);
    return dia.toLocaleDateString('es', { weekday: 'long', day: 'numeric' });
  }

  getDiaLetra(offsetDesdeLunes: number): string {
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return dias[offsetDesdeLunes];
  }

  // Demo data para cuando no hay sesiones reales
  private getDemoSesiones(): Sesion[] {
    const hoy = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const fecha = new Date(hoy.getTime() - i * 2 * 86400000).toISOString().slice(0, 10);
      return {
        id: `demo_${i}`,
        usuario_id: 'demo-user',
        tipo_actividad_id: 'default_1',
        fecha,
        duracion_min: 30 + Math.floor(Math.random() * 45),
        esfuerzo_percibido: 4 + Math.floor(Math.random() * 5),
        notas: null
      };
    });
  }
}
