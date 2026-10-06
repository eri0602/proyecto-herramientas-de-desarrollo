import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TiposActividadService } from '../../core/services/tipos-actividad.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoActividad } from '../../core/models/tipo-actividad.model';

@Component({
  selector: 'app-tipos-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tipos-actividad.component.html',
  styleUrls: ['./tipos-actividad.component.css']
})
export class TiposActividadComponent implements OnInit {
  private tiposService = inject(TiposActividadService);
  private authService = inject(AuthService);

  tipos = signal<TipoActividad[]>([]);
  nuevoNombre = signal('');
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Iconos visuales predefinidos por palabra clave
  readonly iconMap: Record<string, string> = {
    carrera: 'bi-person-walking',
    correr: 'bi-person-walking',
    running: 'bi-person-walking',
    ciclismo: 'bi-bicycle',
    bici: 'bi-bicycle',
    natacion: 'bi-water',
    nadar: 'bi-water',
    hiit: 'bi-lightning-charge-fill',
    fuerza: 'bi-shield-shaded',
    pesas: 'bi-shield-shaded',
    caminata: 'bi-geo-alt-fill',
    yoga: 'bi-flower1',
    boxeo: 'bi-hand-index-thumb-fill'
  };

  ngOnInit(): void {
    this.cargarTipos();
  }

  async cargarTipos(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.tiposService.getTiposActividad();
      this.tipos.set(data);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al cargar tipos de actividad');
    } finally {
      this.loading.set(false);
    }
  }

  async agregarTipo(): Promise<void> {
    const nombre = this.nuevoNombre().trim();
    if (!nombre) {
      this.errorMessage.set('Escribe el nombre de la actividad.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.tiposService.createTipoActividad({ nombre });
      this.nuevoNombre.set('');
      this.successMessage.set(`¡Actividad "${nombre}" registrada con éxito!`);
      await this.cargarTipos();
      setTimeout(() => this.successMessage.set(null), 4000);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al guardar la actividad');
    } finally {
      this.saving.set(false);
    }
  }

  async eliminarTipo(id?: string, nombre?: string): Promise<void> {
    if (!id) return;
    if (!confirm(`¿Estás seguro de eliminar "${nombre || 'esta actividad'}"?`)) {
      return;
    }

    try {
      await this.tiposService.deleteTipoActividad(id);
      this.successMessage.set(`Actividad eliminada correctamente.`);
      await this.cargarTipos();
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al eliminar actividad.');
    }
  }

  getIcon(nombre: string): string {
    const lower = nombre.toLowerCase();
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return 'bi-activity';
  }
}
