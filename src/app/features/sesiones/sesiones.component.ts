import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SesionesService } from '../../core/services/sesiones.service';
import { TiposActividadService } from '../../core/services/tipos-actividad.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sesion } from '../../core/models/sesion.model';
import { TipoActividad } from '../../core/models/tipo-actividad.model';

export interface Logro {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  desbloqueado: boolean;
  progreso: number; // 0 - 100
  progresoTexto: string;
}

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sesiones.component.html',
  styleUrls: ['./sesiones.component.css']
})
export class SesionesComponent implements OnInit {
  private sesionesService = inject(SesionesService);
  private tiposService = inject(TiposActividadService);
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  private userId = 'demo-user';

  // Estado
  sesiones = signal<Sesion[]>([]);
  tiposActividad = signal<TipoActividad[]>([]);
  loading = signal(false);
  guardando = signal(false);
  editando = signal<Sesion | null>(null);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);
  mostrarFormulario = signal(false);
  mostrarModalLogros = signal(false);

  // Filtros
  filtroTipo = signal<string>('');
  filtroFechaDesde = signal<string>('');
  filtroFechaHasta = signal<string>('');
  filtroTexto = signal<string>('');

  // Formulario
  form = this.fb.group({
    tipo_actividad_id: ['', Validators.required],
    fecha: ['', Validators.required],
    duracion_min: [null as number | null, [Validators.required, Validators.min(1), Validators.max(600)]],
    esfuerzo_percibido: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    notas: ['']
  });

  // Sesiones filtradas
  sesionesFiltradasComputed = computed(() => {
    let lista = this.sesiones();

    if (this.filtroTipo()) {
      lista = lista.filter((s: Sesion) => s.tipo_actividad_id === this.filtroTipo());
    }
    if (this.filtroFechaDesde()) {
      lista = lista.filter((s: Sesion) => s.fecha >= this.filtroFechaDesde());
    }
    if (this.filtroFechaHasta()) {
      lista = lista.filter((s: Sesion) => s.fecha <= this.filtroFechaHasta());
    }
    if (this.filtroTexto().trim()) {
      const q = this.filtroTexto().trim().toLowerCase();
      lista = lista.filter(s =>
        (s.notas && s.notas.toLowerCase().includes(q)) ||
        this.getNombreTipo(s.tipo_actividad_id).toLowerCase().includes(q)
      );
    }
    if (this.filtroTexto().trim()) {
      const q = this.filtroTexto().trim().toLowerCase();
      lista = lista.filter(s =>
        (s.notas && s.notas.toLowerCase().includes(q)) ||
        this.getNombreTipo(s.tipo_actividad_id).toLowerCase().includes(q)
      );
    }

    return lista;
  });

  // Estadísticas rápidas
  totalSesiones = computed(() => this.sesionesFiltradasComputed().length);
  totalMinutos = computed(() => this.sesionesFiltradasComputed().reduce((acc: number, s: Sesion) => acc + s.duracion_min, 0));
  totalHoras = computed(() => (this.totalMinutos() / 60).toFixed(1));
  esfuerzoPromedio = computed(() => {
    const s = this.sesionesFiltradasComputed();
    if (!s.length) return '0.0';
    return (s.reduce((acc: number, ses: Sesion) => acc + ses.esfuerzo_percibido, 0) / s.length).toFixed(1);
  });

  // ===== Sistema de Logros de Resistencia =====
  logros = computed((): Logro[] => {
    const list = this.sesiones();
    const totalMin = list.reduce((acc, s) => acc + s.duracion_min, 0);
    const tieneFondoLargo = list.some(s => s.duracion_min >= 60);
    const maxDuracion = list.reduce((max, s) => Math.max(max, s.duracion_min), 0);
    const tieneZonaRoja = list.some(s => s.esfuerzo_percibido >= 8);
    const tiposDistintos = new Set(list.map(s => s.tipo_actividad_id)).size;

    // Calcular max sesiones en cualquier semana de 7 días
    let maxSesionesSemana = 0;
    const fechas = list.map(s => new Date(s.fecha).getTime()).sort();
    for (let i = 0; i < fechas.length; i++) {
      let count = 0;
      for (let j = i; j < fechas.length; j++) {
        if (fechas[j] - fechas[i] <= 7 * 24 * 60 * 60 * 1000) {
          count++;
        }
      }
      if (count > maxSesionesSemana) maxSesionesSemana = count;
    }

    return [
      {
        id: 'primer-paso',
        titulo: 'Bautismo de Resistencia',
        icono: 'bi-rocket-takeoff-fill',
        descripcion: 'Registra tu primer entrenamiento en la plataforma.',
        desbloqueado: list.length >= 1,
        progreso: list.length >= 1 ? 100 : 0,
        progresoTexto: list.length >= 1 ? '¡Completado!' : '0 / 1 sesión'
      },
      {
        id: 'tirada-larga',
        titulo: 'Fondo de Resistencia',
        icono: 'bi-stopwatch-fill',
        descripcion: 'Completa una sesión de al menos 60 minutos continuos.',
        desbloqueado: tieneFondoLargo,
        progreso: Math.min(100, Math.round((maxDuracion / 60) * 100)),
        progresoTexto: tieneFondoLargo ? '¡Completado!' : `${maxDuracion} / 60 min`
      },
      {
        id: 'zona-roja',
        titulo: 'Esfuerzo Máximo',
        icono: 'bi-fire',
        descripcion: 'Registra una sesión con percepción de esfuerzo 8/10 o superior.',
        desbloqueado: tieneZonaRoja,
        progreso: tieneZonaRoja ? 100 : 0,
        progresoTexto: tieneZonaRoja ? '¡Completado!' : 'Requiere esfuerzo ≥ 8'
      },
      {
        id: 'club-300',
        titulo: 'Club 300 Minutos',
        icono: 'bi-trophy-fill',
        descripcion: 'Acumula un total de 300 minutos de entrenamiento (5 horas).',
        desbloqueado: totalMin >= 300,
        progreso: Math.min(100, Math.round((totalMin / 300) * 100)),
        progresoTexto: totalMin >= 300 ? '¡Completado!' : `${totalMin} / 300 min`
      },
      {
        id: 'semana-fuego',
        titulo: 'Semana de Fuego',
        icono: 'bi-lightning-charge-fill',
        descripcion: 'Registra 3 o más sesiones dentro de un intervalo de 7 días.',
        desbloqueado: maxSesionesSemana >= 3,
        progreso: Math.min(100, Math.round((maxSesionesSemana / 3) * 100)),
        progresoTexto: maxSesionesSemana >= 3 ? '¡Completado!' : `${maxSesionesSemana} / 3 sesiones`
      },
      {
        id: 'multidisciplina',
        titulo: 'Atleta Multidisciplinario',
        icono: 'bi-diagram-3-fill',
        descripcion: 'Practica al menos 2 disciplinas de resistencia diferentes.',
        desbloqueado: tiposDistintos >= 2,
        progreso: Math.min(100, Math.round((tiposDistintos / 2) * 100)),
        progresoTexto: tiposDistintos >= 2 ? '¡Completado!' : `${tiposDistintos} / 2 disciplinas`
      }
    ];
  });

  totalLogrosDesbloqueados = computed(() =>
    this.logros().filter(l => l.desbloqueado).length
  );

  async ngOnInit() {
    // Resolver userId desde Supabase antes de cargar sesiones
    try {
      const { data } = await this.supabaseService.supabase.auth.getSession();
      this.userId = data.session?.user?.id ?? 'demo-user';
    } catch { /* sin conexión — usar demo */ }
    await Promise.all([this.cargarSesiones(), this.cargarTipos()]);
  }

  async cargarSesiones() {
    this.loading.set(true);
    try {
      const data = await this.sesionesService.getSesiones(this.userId);
      this.sesiones.set(data);
    } catch {
      this.error.set('Error al cargar sesiones');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarTipos() {
    const tipos = await this.tiposService.getTiposActividad();
    this.tiposActividad.set(tipos);
  }

  abrirFormularioNuevo() {
    this.editando.set(null);
    this.form.reset({ esfuerzo_percibido: 5 });
    this.mostrarFormulario.set(true);
  }

  abrirEditar(sesion: Sesion) {
    this.editando.set(sesion);
    this.form.patchValue({
      tipo_actividad_id: sesion.tipo_actividad_id,
      fecha: sesion.fecha,
      duracion_min: sesion.duracion_min,
      esfuerzo_percibido: sesion.esfuerzo_percibido,
      notas: sesion.notas ?? ''
    });
    this.mostrarFormulario.set(true);
  }

  cancelar() {
    this.mostrarFormulario.set(false);
    this.editando.set(null);
    this.form.reset({ esfuerzo_percibido: 5 });
    this.error.set(null);
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    const userId = this.userId;
    const valores = this.form.value;

    try {
      if (this.editando()) {
        await this.sesionesService.updateSesion(this.editando()!.id!, {
          tipo_actividad_id: valores.tipo_actividad_id!,
          fecha: valores.fecha!,
          duracion_min: Number(valores.duracion_min),
          esfuerzo_percibido: Number(valores.esfuerzo_percibido),
          notas: valores.notas || null
        });
        this.exito.set('Sesión actualizada correctamente');
      } else {
        await this.sesionesService.createSesion({
          usuario_id: userId,
          tipo_actividad_id: valores.tipo_actividad_id!,
          fecha: valores.fecha!,
          duracion_min: Number(valores.duracion_min),
          esfuerzo_percibido: Number(valores.esfuerzo_percibido),
          notas: valores.notas || null
        });
        this.exito.set('Sesión registrada correctamente');
      }
      this.cancelar();
      await this.cargarSesiones();
      setTimeout(() => this.exito.set(null), 3000);
    } catch (e: any) {
      this.error.set(e.message || 'Error al guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(sesion: Sesion) {
    if (!confirm(`¿Eliminar la sesión del ${sesion.fecha}?`)) return;
    try {
      await this.sesionesService.deleteSesion(sesion.id!);
      this.exito.set('Sesión eliminada');
      setTimeout(() => this.exito.set(null), 2000);
      await this.cargarSesiones();
    } catch {
      this.error.set('Error al eliminar');
    }
  }

  getNombreTipo(id: string): string {
    return this.tiposActividad().find(t => t.id === id)?.nombre ?? id;
  }

  limpiarFiltros() {
    this.filtroTipo.set('');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroTexto.set('');
  }

  // ===== Exportación a CSV =====
  exportarCSV() {
    const lista = this.sesionesFiltradasComputed();
    if (lista.length === 0) {
      this.error.set('No hay sesiones que coincidan con los filtros para exportar.');
      setTimeout(() => this.error.set(null), 3000);
      return;
    }

    const encabezados = [
      'ID',
      'Fecha',
      'Actividad',
      'Duracion_Minutos',
      'Duracion_Horas',
      'Esfuerzo_Percibido',
      'Nivel_Esfuerzo',
      'Notas'
    ];

    const filas = lista.map(s => [
      `"${s.id || ''}"`,
      `"${s.fecha}"`,
      `"${this.getNombreTipo(s.tipo_actividad_id)}"`,
      s.duracion_min,
      (s.duracion_min / 60).toFixed(2),
      s.esfuerzo_percibido,
      `"${this.getEsfuerzoLabel(s.esfuerzo_percibido)}"`,
      `"${(s.notas || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas.map(f => f.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const hoy = new Date().toISOString().substring(0, 10);
    link.download = `resiste_sesiones_${hoy}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.exito.set(`Reporte CSV exportado con ${lista.length} sesiones.`);
    setTimeout(() => this.exito.set(null), 3500);
  }

  getEsfuerzoLabel(val: number): string {
    if (val <= 3) return '😌 Suave';
    if (val <= 6) return '💪 Moderado';
    if (val <= 8) return '🔥 Intenso';
    return '💀 Máximo';
  }

  getEsfuerzoColor(val: number): string {
    if (val <= 3) return '#4ade80';
    if (val <= 6) return '#facc15';
    if (val <= 8) return '#fb923c';
    return '#f87171';
  }

  // ===== Handlers de Filtros =====
  onFiltroTipoChange(event: Event): void {
    this.filtroTipo.set((event.target as HTMLSelectElement).value);
  }

  onFiltroDesdeChange(event: Event): void {
    this.filtroFechaDesde.set((event.target as HTMLInputElement).value);
  }

  onFiltroHastaChange(event: Event): void {
    this.filtroFechaHasta.set((event.target as HTMLInputElement).value);
  }

  onFiltroTextoChange(event: Event): void {
    this.filtroTexto.set((event.target as HTMLInputElement).value);
  }
}
