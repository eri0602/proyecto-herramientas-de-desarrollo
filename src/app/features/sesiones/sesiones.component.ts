import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SesionesService } from '../../core/services/sesiones.service';
import { TiposActividadService } from '../../core/services/tipos-actividad.service';
import { AuthService } from '../../core/services/auth.service';
import { Sesion } from '../../core/models/sesion.model';
import { TipoActividad } from '../../core/models/tipo-actividad.model';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sesiones.component.html',
  styleUrls: ['./sesiones.component.css']
})
export class SesionesComponent implements OnInit {
  private sesionesService = inject(SesionesService);
  private tiposService = inject(TiposActividadService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  sesiones = signal<Sesion[]>([]);
  tipos = signal<TipoActividad[]>([]);
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Formulario de Registro / Edición
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  formTipoActividadId = signal('');
  formFecha = signal(new Date().toISOString().split('T')[0]);
  formDuracionMin = signal(45);
  formEsfuerzo = signal(6);
  formNotas = signal('');

  // Filtros de búsqueda para Historial (Semana 6)
  filterTipoId = signal('TODOS');
  filterSearch = signal('');
  filterOrderBy = signal<'reciente' | 'duracion' | 'esfuerzo'>('reciente');

  // Listado filtrado computado
  filteredSesiones = computed(() => {
    let list = this.sesiones();
    const tipo = this.filterTipoId();
    const query = this.filterSearch().toLowerCase().trim();
    const order = this.filterOrderBy();

    if (tipo !== 'TODOS') {
      list = list.filter(s => s.tipo_actividad_id === tipo);
    }

    if (query) {
      list = list.filter(s =>
        (s.notas && s.notas.toLowerCase().includes(query)) ||
        (s.tipos_actividad?.nombre && s.tipos_actividad.nombre.toLowerCase().includes(query))
      );
    }

    return [...list].sort((a, b) => {
      if (order === 'duracion') {
        return b.duracion_min - a.duracion_min;
      }
      if (order === 'esfuerzo') {
        return b.esfuerzo_percibido - a.esfuerzo_percibido;
      }
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  });

  // Métricas rápidas de las sesiones filtradas
  totalMinutosFiltrados = computed(() => {
    return this.filteredSesiones().reduce((acc, s) => acc + (s.duracion_min || 0), 0);
  });

  promedioEsfuerzo = computed(() => {
    const list = this.filteredSesiones();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, s) => acc + (s.esfuerzo_percibido || 0), 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  ngOnInit(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const user = this.currentUser();
      const userId = user?.id || 'demo_user';

      const [tiposData, sesionesData] = await Promise.all([
        this.tiposService.getTiposActividad(),
        this.sesionesService.getSesiones(userId)
      ]);

      this.tipos.set(tiposData);
      this.sesiones.set(sesionesData);

      if (tiposData.length > 0 && !this.formTipoActividadId()) {
        this.formTipoActividadId.set(tiposData[0].id || '');
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al cargar los datos de sesiones');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmitForm(): Promise<void> {
    const user = this.currentUser();
    const userId = user?.id || 'demo_user';

    if (!this.formTipoActividadId()) {
      this.errorMessage.set('Por favor selecciona un tipo de actividad.');
      return;
    }

    if (this.formDuracionMin() <= 0) {
      this.errorMessage.set('La duración debe ser mayor a 0 minutos.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      if (this.isEditing() && this.editingId()) {
        // Semana 7: Editar sesión
        await this.sesionesService.updateSesion(this.editingId()!, {
          tipo_actividad_id: this.formTipoActividadId(),
          fecha: this.formFecha(),
          duracion_min: Number(this.formDuracionMin()),
          esfuerzo_percibido: Number(this.formEsfuerzo()),
          notas: this.formNotas()?.trim() || null
        });
        this.successMessage.set('¡Sesión actualizada con éxito!');
        this.cancelEdit();
      } else {
        // Semana 5: Registrar nueva sesión
        await this.sesionesService.createSesion({
          usuario_id: userId,
          tipo_actividad_id: this.formTipoActividadId(),
          fecha: this.formFecha(),
          duracion_min: Number(this.formDuracionMin()),
          esfuerzo_percibido: Number(this.formEsfuerzo()),
          notas: this.formNotas()?.trim() || null
        });
        this.successMessage.set('¡Sesión de entrenamiento registrada!');
        this.resetForm();
      }

      await this.cargarDatos();
      setTimeout(() => this.successMessage.set(null), 4000);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al guardar la sesión');
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(sesion: Sesion): void {
    if (!sesion.id) return;
    this.isEditing.set(true);
    this.editingId.set(sesion.id);
    this.formTipoActividadId.set(sesion.tipo_actividad_id);
    this.formFecha.set(sesion.fecha);
    this.formDuracionMin.set(sesion.duracion_min);
    this.formEsfuerzo.set(sesion.esfuerzo_percibido);
    this.formNotas.set(sesion.notas || '');

    // Scroll to top / form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm(): void {
    const tipos = this.tipos();
    this.formTipoActividadId.set(tipos.length > 0 ? tipos[0].id || '' : '');
    this.formFecha.set(new Date().toISOString().split('T')[0]);
    this.formDuracionMin.set(45);
    this.formEsfuerzo.set(6);
    this.formNotas.set('');
  }

  async deleteSesion(id?: string): Promise<void> {
    if (!id) return;
    if (!confirm('¿Estás seguro de eliminar esta sesión de entrenamiento?')) {
      return;
    }

    try {
      await this.sesionesService.deleteSesion(id);
      this.successMessage.set('Sesión eliminada.');
      await this.cargarDatos();
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al eliminar sesión.');
    }
  }

  getEffortLabel(val: number): { label: string; color: string } {
    if (val <= 2) return { label: 'Muy suave', color: '#60a5fa' };
    if (val <= 4) return { label: 'Ligero', color: '#34d399' };
    if (val <= 6) return { label: 'Moderado', color: '#fbbf24' };
    if (val <= 8) return { label: 'Intenso / Fuerte', color: '#f97316' };
    return { label: 'Máximo / Extenuante', color: '#ef4444' };
  }
}
