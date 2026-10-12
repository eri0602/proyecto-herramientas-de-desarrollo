import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SesionesService } from '../../core/services/sesiones.service';
import { TiposActividadService } from '../../core/services/tipos-actividad.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Sesion } from '../../core/models/sesion.model';
import { TipoActividad } from '../../core/models/tipo-actividad.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  // Filtros
  filtroTipo = signal<string>('');
  filtroFechaDesde = signal<string>('');
  filtroFechaHasta = signal<string>('');

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
      lista = lista.filter(s => s.tipo_actividad_id === this.filtroTipo());
    }
    if (this.filtroFechaDesde()) {
      lista = lista.filter(s => s.fecha >= this.filtroFechaDesde());
    }
    if (this.filtroFechaHasta()) {
      lista = lista.filter(s => s.fecha <= this.filtroFechaHasta());
    }

    return lista;
  });

  // Estadísticas rápidas
  totalSesiones = computed(() => this.sesionesFiltradasComputed().length);
  totalMinutos = computed(() => this.sesionesFiltradasComputed().reduce((acc, s) => acc + s.duracion_min, 0));
  totalHoras = computed(() => (this.totalMinutos() / 60).toFixed(1));
  esfuerzoPromedio = computed(() => {
    const s = this.sesionesFiltradasComputed();
    if (!s.length) return 0;
    return (s.reduce((acc, ses) => acc + ses.esfuerzo_percibido, 0) / s.length).toFixed(1);
  });

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
    } catch (e: any) {
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
    } catch (e: any) {
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

  // ===== Handlers para filtros (evitan type-casts en el template) =====
  onFiltroTipoChange(event: Event): void {
    this.filtroTipo.set((event.target as HTMLSelectElement).value);
  }

  onFiltroDesdeChange(event: Event): void {
    this.filtroFechaDesde.set((event.target as HTMLInputElement).value);
  }

  onFiltroHastaChange(event: Event): void {
    this.filtroFechaHasta.set((event.target as HTMLInputElement).value);
  }
}
