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

interface NotificationItem {
  id: number;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotificationToast {
  id: number;
  text: string;
  type: string;
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

<<<<<<< Updated upstream
      const userId: string = data.session?.user?.id ?? 'demo-user';
      const sesionesData = await this.sesionesService.getSesiones(userId);
      this.sesiones.set(sesionesData && sesionesData.length > 0 ? sesionesData : this.getDemoSesiones());
    } catch {
      // fallback — datos de demo si no hay sesiones o no hay sesión activa
      this.sesiones.set(this.getDemoSesiones());
    } finally {
      this.loading.set(false);
=======
  // Sesiones reales del usuario
  userSessions = signal<Sesion[]>([]);
  targetWeeklyMinutes = signal(240); // 4 horas objetivo semanal base

  readonly totalSessions = computed(() => this.userSessions().length);

  readonly weeklyMinutes = computed(() => {
    const sessions = this.userSessions();
    if (sessions.length === 0) return 0;

    const now = new Date();
    // Obtener el inicio de la semana (Lunes)
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return sessions
      .filter((s: Sesion) => new Date(s.fecha + 'T00:00:00').getTime() >= startOfWeek.getTime())
      .reduce((sum: number, s: Sesion) => sum + (s.duracion_min || 0), 0);
  });

  readonly totalMinutes = computed(() => {
    return this.userSessions().reduce((sum: number, s: Sesion) => sum + (s.duracion_min || 0), 0);
  });

  readonly streakDays = computed(() => {
    const sessions = this.userSessions();
    if (sessions.length === 0) return 0;

    const dates = Array.from(new Set(sessions.map((s: Sesion) => s.fecha))).sort().reverse();
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Verificar si entrenó hoy o ayer
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      resultado.push({
        semana: `S${8 - i}`,
        horas,
        sesiones: sesSemana.length,
        esfuerzoPromedio: esfuerzoPromedioSem
      });
    }
    return resultado;
=======
  // Notificaciones Toast y Centro de Notificaciones
  notifications = signal<NotificationToast[]>([]);
  showNotifDropdown = signal(false);
  notificationHistory = signal<NotificationItem[]>([
    {
      id: 1,
      title: '¡Hora de entrenar! 💪',
      body: 'Recuerda: Tu sesión de resistencia física te espera hoy.',
      time: 'Hace 5 min',
      read: false
    },
    {
      id: 2,
      title: 'Progreso Semanal ⚡',
      body: '¡Buen ritmo! Sigue sumando minutos hacia tu meta.',
      time: 'Hace 2 horas',
      read: false
    },
    {
      id: 3,
      title: 'Consejo del Coach 💡',
      body: 'La consistencia supera a la intensidad. ¡No pares!',
      time: 'Ayer',
      read: true
    }
  ]);

  readonly unreadCount = computed(() => {
    return this.notificationHistory().filter((n: NotificationItem) => !n.read).length;
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  getEsfuerzoColor(val: number): string {
    if (val <= 3) return '#4ade80';
    if (val <= 6) return '#facc15';
    if (val <= 8) return '#fb923c';
    return '#f87171';
=======
  showNotification(text: string, type: 'motivational' | 'info'): void {
    const id = Date.now();
    this.notifications.update((n: NotificationToast[]) => [...n, { id, text, type }]);
    setTimeout(() => {
      this.notifications.update((n: NotificationToast[]) => n.filter((notif: NotificationToast) => notif.id !== id));
    }, 8000);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  toggleNotifDropdown(): void {
    this.showNotifDropdown.update((v: boolean) => !v);
  }

  markAllNotifsAsRead(): void {
    this.notificationHistory.update((list: NotificationItem[]) => list.map((n: NotificationItem) => ({ ...n, read: true })));
  }

  triggerMotivationalToast(): void {
    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    this.showNotification(`¡Motivación para hoy! 🔥: ${randomQuote}`, 'motivational');
  }

  setProgress(val: number): void {
    this.targetWeeklyMinutes.set(Math.round((this.weeklyMinutes() / (val || 1)) * 100) || 240);
    const color = this.progressColor();
    const status = this.progressStatus();
    this.showNotification(`Progreso calculado: ${this.weekProgress()}% — Estado: ${status}`, 'info');
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    console.log('Navigating to', route);
>>>>>>> Stashed changes
  }
}
