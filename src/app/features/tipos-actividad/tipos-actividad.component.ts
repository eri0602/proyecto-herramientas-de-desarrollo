import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TiposActividadService } from '../../core/services/tipos-actividad.service';
import { TipoActividad } from '../../core/models/tipo-actividad.model';

@Component({
  selector: 'app-tipos-actividad',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tipos-actividad.component.html',
  styleUrls: ['./tipos-actividad.component.css']
})
export class TiposActividadComponent implements OnInit {
  private tiposService = inject(TiposActividadService);
  private fb = inject(FormBuilder);

  tipos = signal<TipoActividad[]>([]);
  loading = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
  });

  async ngOnInit() {
    await this.cargarTipos();
  }

  async cargarTipos() {
    this.loading.set(true);
    try {
      const data = await this.tiposService.getTiposActividad();
      this.tipos.set(data);
    } catch (e: any) {
      this.error.set('Error al cargar tipos de actividad');
    } finally {
      this.loading.set(false);
    }
  }

  async guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set(null);
    try {
      const nombre = this.form.value.nombre!.trim();
      await this.tiposService.createTipoActividad({ nombre });
      this.form.reset();
      this.exito.set(`"${nombre}" agregado correctamente`);
      setTimeout(() => this.exito.set(null), 3000);
      await this.cargarTipos();
    } catch (e: any) {
      this.error.set(e.message || 'Error al guardar');
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await this.tiposService.deleteTipoActividad(id!);
      this.exito.set(`"${nombre}" eliminado`);
      setTimeout(() => this.exito.set(null), 2000);
      await this.cargarTipos();
    } catch (e: any) {
      this.error.set('Error al eliminar');
    }
  }
}
