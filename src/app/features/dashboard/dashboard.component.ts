import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SesionesService } from '../../core/services/sesiones.service';
import { Sesion } from '../../core/models/sesion.model';

interface WorkoutTip {
  icon: string;
  title: string;
  body: string;
}

interface FeatureCard {
  icon: string;
  iconColor: string;
  badge: string;
  title: string;
  description: string;
  route: string;
  stats?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sesionesService = inject(SesionesService);
  private router = inject(Router);

  readonly profile = this.authService.currentProfile;
  readonly isAuthenticated = this.authService.isAuthenticated;

  greeting = signal('');
  currentTime = signal('');
  currentDate = signal('');
  motivationalQuote = signal('');
  showOnboarding = signal(false);
  activeTooltip = signal<string | null>(null);
  animatedStats = signal(false);
  readonly currentYear = new Date().getFullYear();

  private clockInterval: any;
  private statAnimTimeout: any;

  readonly userName = computed(() => {
    const profile = this.profile();
    return profile?.nombre?.split(' ')[0] || 'Atleta';
  });

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
      .filter(s => new Date(s.fecha + 'T00:00:00').getTime() >= startOfWeek.getTime())
      .reduce((sum, s) => sum + (s.duracion_min || 0), 0);
  });

  readonly totalMinutes = computed(() => {
    return this.userSessions().reduce((sum, s) => sum + (s.duracion_min || 0), 0);
  });

  readonly streakDays = computed(() => {
    const sessions = this.userSessions();
    if (sessions.length === 0) return 0;

    const dates = Array.from(new Set(sessions.map(s => s.fecha))).sort().reverse();
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Verificar si entrenó hoy o ayer
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }

    let checkDate = new Date(dates[0] + 'T00:00:00');
    for (const dStr of dates) {
      const d = new Date(dStr + 'T00:00:00');
      const diffDays = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak++;
        checkDate = d;
      } else {
        break;
      }
    }
    return streak;
  });

  readonly weekProgress = computed(() => {
    const target = this.targetWeeklyMinutes();
    const current = this.weeklyMinutes();
    if (target <= 0) return 0;
    const pct = Math.round((current / target) * 100);
    return Math.min(pct, 100);
  });

  readonly progressColor = computed(() => {
    const p = this.weekProgress();
    if (p === 0) return '#64748b'; // Gris
    if (p < 30) return '#f97316'; // Naranja (al inicio)
    if (p < 70) return '#fbbf24'; // Amarillo (en progreso - 42%)
    if (p < 100) return '#34d399'; // Verde claro (avanzado)
    return '#10b981'; // Verde esmeralda (completado)
  });

  readonly progressStatus = computed(() => {
    const p = this.weekProgress();
    if (p === 0) return 'Sin iniciar';
    if (p < 30) return 'Iniciando (Naranja)';
    if (p < 70) return 'En progreso (Amarillo)';
    if (p < 100) return 'Casi listo (Verde claro)';
    return '¡Completado! (Verde)';
  });

  // Notificaciones Toast y Centro de Notificaciones
  notifications = signal<{ id: number; text: string; type: string }[]>([]);
  showNotifDropdown = signal(false);
  notificationHistory = signal<Array<{ id: number; title: string; body: string; time: string; read: boolean }>>([
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
    return this.notificationHistory().filter(n => !n.read).length;
  });

  readonly quotes = [
    '"El dolor de hoy es la fuerza de mañana." — Arnold Schwarzenegger',
    '"No pares cuando estés cansado. Para cuando hayas terminado."',
    '"Cada rep. y cada kilómetro te acerca a tu mejor versión."',
    '"La disciplina es elegir entre lo que quieres ahora y lo que quieres más."',
    '"Tu único límite eres tú mismo."',
  ];

  readonly tips: WorkoutTip[] = [
    {
      icon: 'bi-droplet-fill',
      title: 'Hidratación',
      body: 'Bebe al menos 500ml de agua antes de entrenar. Mantén hidratación durante toda la sesión.',
    },
    {
      icon: 'bi-alarm-fill',
      title: 'Calentamiento',
      body: 'Dedica 5–10 min a calentar. Activa músculos y articulaciones para evitar lesiones.',
    },
    {
      icon: 'bi-moon-stars-fill',
      title: 'Descanso',
      body: 'El músculo crece mientras descansas. Respeta al menos 1 día de recuperación entre grupos musculares.',
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Progresión',
      body: 'Aumenta intensidad gradualmente: más tiempo, más ritmo o menos descanso semana a semana.',
    },
  ];

  readonly features = computed<FeatureCard[]>(() => [
    {
      icon: 'bi-play-circle-fill',
      iconColor: '#38bdf8',
      badge: 'Principal',
      title: 'Registrar Sesión',
      description: 'Registra cada entrenamiento: tipo de actividad, duración y nivel de esfuerzo percibido.',
      route: '/sesiones',
      stats: `${this.userSessions().length} sesiones registradas`,
    },
    {
      icon: 'bi-trophy-fill',
      iconColor: '#fbbf24',
      badge: 'Metas',
      title: 'Mis Metas',
      description: 'Define objetivos semanales o mensuales y monitorea tu progreso en tiempo real.',
      route: '/metas',
      stats: 'Meta activa semanal',
    },
    {
      icon: 'bi-activity',
      iconColor: '#a78bfa',
      badge: 'Actividades',
      title: 'Tipos de Actividad',
      description: 'Configura tus disciplinas favoritas: carrera, ciclismo, natación, HIIT y más.',
      route: '/tipos-actividad',
    },
    {
      icon: 'bi-bar-chart-line-fill',
      iconColor: '#34d399',
      badge: 'Estadísticas',
      title: 'Mi Progreso',
      description: 'Visualiza tu historial de entrenamientos, racha de días activos y minutos acumulados.',
      route: '/sesiones',
      stats: `${this.totalMinutes()} min totales`,
    },
  ]);

  async ngOnInit(): Promise<void> {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.updateGreetingAndTime();
    this.clockInterval = setInterval(() => this.updateGreetingAndTime(), 60000);
    this.motivationalQuote.set(this.quotes[Math.floor(Math.random() * this.quotes.length)]);

    // Cargar sesiones reales del usuario
    await this.loadSessionsData();

    // Detect new user (no sessions logged yet)
    const hasSeenOnboarding = localStorage.getItem('resiste_onboarding_seen');
    if (!hasSeenOnboarding) {
      this.showOnboarding.set(true);
    }

    // Animate stats on load
    this.statAnimTimeout = setTimeout(() => {
      this.animatedStats.set(true);
      this.showNotification('¡Bienvenido a tu panel de entrenamiento! "El éxito es la suma de pequeños esfuerzos diarios."', 'motivational');
    }, 300);
  }

  private async loadSessionsData(): Promise<void> {
    const user = this.authService.currentUser();
    const userId = user?.id || 'demo_user';

    try {
      const data = await this.sesionesService.getSesiones(userId);
      this.userSessions.set(data);
    } catch (err) {
      console.warn('No se pudieron cargar las sesiones para el dashboard:', err);
    }
  }

  showNotification(text: string, type: 'motivational' | 'info'): void {
    const id = Date.now();
    this.notifications.update(n => [...n, { id, text, type }]);
    setTimeout(() => {
      this.notifications.update(n => n.filter(notif => notif.id !== id));
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.statAnimTimeout) clearTimeout(this.statAnimTimeout);
  }

  private updateGreetingAndTime(): void {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 12) this.greeting.set('Buenos días');
    else if (hour < 19) this.greeting.set('Buenas tardes');
    else this.greeting.set('Buenas noches');

    this.currentTime.set(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    this.currentDate.set(now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  dismissOnboarding(): void {
    this.showOnboarding.set(false);
    localStorage.setItem('resiste_onboarding_seen', '1');
  }

  setTooltip(id: string | null): void {
    this.activeTooltip.set(id);
  }

  toggleNotifDropdown(): void {
    this.showNotifDropdown.update(v => !v);
  }

  markAllNotifsAsRead(): void {
    this.notificationHistory.update(list => list.map(n => ({ ...n, read: true })));
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
  }
}
