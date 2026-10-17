import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MetasService } from '../../core/services/metas.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Meta } from '../../core/models/meta.model';

@Component({
  selector: 'app-metas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1><i class="bi bi-bullseye"></i> Mi Meta de Resistencia</h1>
          <p class="subtitle">Define tu plan de resistencia física y monitorea tu progreso semanal</p>
        </div>
        @if (!loading() && metaActual() && !editando()) {
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="iniciarEdicion()">
              <i class="bi bi-pencil-square"></i>
              <span>Modificar Meta</span>
            </button>
          </div>
        }
      </header>

      <!-- Mensajes de alerta -->
      @if (mensajeExito()) {
        <div class="alert alert-success">
          <i class="bi bi-check-circle-fill"></i>
          <span>{{ mensajeExito() }}</span>
        </div>
      }

      @if (error()) {
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ error() }}</span>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando información de tu meta...</p>
        </div>
      } @else {

        <!-- Vista de Resumen / Meta Activa -->
        @if (metaActual() && !editando()) {
          <div class="meta-dashboard">
            <!-- Tarjeta principal de la meta -->
            <div class="main-card hero-meta-card">
              <div class="meta-badge-row">
                <span class="badge badge-discipline">
                  <i class="bi bi-activity"></i> {{ metaActual()?.tipo_resistencia }}
                </span>
                <span class="badge badge-level">
                  <i class="bi bi-bar-chart"></i> Nivel {{ metaActual()?.nivel_inicial | titlecase }}
                </span>
                <span class="badge badge-active">
                  <i class="bi bi-check-circle-fill"></i> Meta Activa
                </span>
              </div>

              <h2 class="hero-title">
                Objetivo: {{ metaActual()?.horas_objetivo_semanales }}h semanales
              </h2>
              <p class="hero-description">
                Programa diseñado para un plazo de <strong>{{ metaActual()?.plazo_semanas }} semanas</strong>,
                enfocado en resistencia aeróbica continua.
              </p>

              <!-- Estadísticas destacadas -->
              <div class="metrics-grid">
                <div class="metric-card">
                  <span class="metric-icon"><i class="bi bi-clock-history"></i></span>
                  <div class="metric-info">
                    <span class="metric-value">{{ metaActual()?.horas_objetivo_semanales }} h</span>
                    <span class="metric-label">Por semana</span>
                  </div>
                </div>

                <div class="metric-card">
                  <span class="metric-icon"><i class="bi bi-calendar-week"></i></span>
                  <div class="metric-info">
                    <span class="metric-value">{{ metaActual()?.plazo_semanas }}</span>
                    <span class="metric-label">Semanas de plan</span>
                  </div>
                </div>

                <div class="metric-card">
                  <span class="metric-icon"><i class="bi bi-flag-fill"></i></span>
                  <div class="metric-info">
                    <span class="metric-value">{{ calcularTotalHoras() }} h</span>
                    <span class="metric-label">Horas proyectadas</span>
                  </div>
                </div>

                <div class="metric-card">
                  <span class="metric-icon"><i class="bi bi-trophy-fill"></i></span>
                  <div class="metric-info">
                    <span class="metric-value">{{ calcularFechaFin() }}</span>
                    <span class="metric-label">Fecha de culminación</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Consejos de preparación según nivel -->
            <div class="info-card">
              <h3><i class="bi bi-lightbulb-fill"></i> Recomendación de ritmo</h3>
              <p class="info-text">
                Con <strong>{{ metaActual()?.horas_objetivo_semanales }} horas por semana</strong>, 
                una distribución óptima es de <strong>3 a 4 sesiones</strong> semanales de entre 45 y 60 minutos,
                manteniendo un nivel de esfuerzo percibido entre 5 y 7.
              </p>
            </div>
          </div>
        }

        <!-- Formulario para Crear o Editar Meta -->
        @if (editando()) {
          <div class="form-container">
            <div class="form-card">
              <div class="form-header">
                <h2>
                  <i class="bi" [class.bi-pencil-square]="metaActual()" [class.bi-rocket-takeoff-fill]="!metaActual()"></i>
                  {{ metaActual() ? 'Actualizar tu Meta' : 'Configura tu Primera Meta' }}
                </h2>
                <p>Ajusta los parámetros para adaptar el seguimiento a tu condición actual.</p>
              </div>

              <form [formGroup]="form" (ngSubmit)="guardar()">
                <!-- Tipo de resistencia -->
                <div class="form-group">
                  <label for="tipo_resistencia">Disciplina / Actividad Principal</label>
                  <select id="tipo_resistencia" formControlName="tipo_resistencia" class="form-control">
                    @for (tipo of tiposResistencia; track tipo) {
                      <option [value]="tipo">{{ tipo }}</option>
                    }
                  </select>
                </div>

                <!-- Nivel inicial -->
                <div class="form-group">
                  <label for="nivel_inicial">Nivel Inicial</label>
                  <select id="nivel_inicial" formControlName="nivel_inicial" class="form-control">
                    @for (nivel of niveles; track nivel.id) {
                      <option [value]="nivel.id">{{ nivel.label }} — {{ nivel.desc }}</option>
                    }
                  </select>
                </div>

                <!-- Grid de parámetros numéricos -->
                <div class="form-row">
                  <div class="form-group col">
                    <label for="horas_objetivo_semanales">Horas Objetivo por Semana (h)</label>
                    <input
                      type="number"
                      id="horas_objetivo_semanales"
                      formControlName="horas_objetivo_semanales"
                      class="form-control"
                      min="0.5"
                      max="40"
                      step="0.5"
                      placeholder="ej. 3.5"
                    />
                    @if (form.get('horas_objetivo_semanales')?.invalid && form.get('horas_objetivo_semanales')?.touched) {
                      <span class="field-error">Ingresa un valor entre 0.5 y 40 horas.</span>
                    }
                  </div>

                  <div class="form-group col">
                    <label for="plazo_semanas">Plazo del Plan (Semanas)</label>
                    <input
                      type="number"
                      id="plazo_semanas"
                      formControlName="plazo_semanas"
                      class="form-control"
                      min="1"
                      max="52"
                      placeholder="ej. 8"
                    />
                    @if (form.get('plazo_semanas')?.invalid && form.get('plazo_semanas')?.touched) {
                      <span class="field-error">Ingresa entre 1 y 52 semanas.</span>
                    }
                  </div>
                </div>

                <!-- Fecha de inicio -->
                <div class="form-group">
                  <label for="fecha_inicio">Fecha de Inicio</label>
                  <input
                    type="date"
                    id="fecha_inicio"
                    formControlName="fecha_inicio"
                    class="form-control"
                  />
                </div>

                <!-- Botones de Acción -->
                <div class="form-actions">
                  @if (metaActual()) {
                    <button
                      type="button"
                      class="btn btn-secondary"
                      (click)="cancelarEdicion()"
                      [disabled]="guardando()"
                    >
                      Cancelar
                    </button>
                  }
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="form.invalid || guardando()"
                  >
                    {{ guardando() ? 'Guardando...' : (metaActual() ? 'Actualizar Meta' : 'Establecer Meta') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .page-container {
      min-height: calc(100vh - 65px);
      background: #080810;
      color: #e2e8f0;
      padding: 2.25rem 2rem 3.5rem;
      font-family: 'Inter', sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1.25rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    h1 i {
      color: #38bdf8;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.925rem;
      margin: 0;
    }

    .alert {
      padding: 0.9rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 1rem;
      color: #94a3b8;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hero-meta-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
    }

    .meta-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.35rem 0.8rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge-discipline {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .badge-level {
      background: rgba(129, 140, 248, 0.15);
      color: #818cf8;
      border: 1px solid rgba(129, 140, 248, 0.3);
    }

    .badge-active {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .hero-title {
      font-size: 1.7rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.5rem;
    }

    .hero-description {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0 0 1.75rem;
      line-height: 1.5;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 1.15rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s, border-color 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(56, 189, 248, 0.25);
    }

    .metric-icon {
      font-size: 1.6rem;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .metric-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .info-card {
      background: rgba(56, 189, 248, 0.05);
      border: 1px solid rgba(56, 189, 248, 0.15);
      border-radius: 14px;
      padding: 1.5rem;
    }

    .info-card h3 {
      font-size: 1.05rem;
      color: #38bdf8;
      margin: 0 0 0.5rem;
    }

    .info-text {
      color: #94a3b8;
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }

    .form-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 2.25rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .form-header {
      margin-bottom: 2rem;
    }

    .form-header h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.35rem;
    }

    .form-header p {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1.25rem;
    }

    .form-row .col {
      flex: 1;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #f1f5f9;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }

    .form-control option {
      background: #1e1e2f;
      color: #f1f5f9;
    }

    .field-error {
      display: block;
      font-size: 0.775rem;
      color: #f87171;
      margin-top: 0.35rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      border-radius: 10px;
      font-size: 0.925rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.25);
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
      color: #f8fafc;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    @media (max-width: 640px) {
      .page-container {
        padding: 1.25rem 1rem;
      }
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
      .header-actions .btn {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
      .hero-meta-card {
        padding: 1.25rem 1rem;
        border-radius: 16px;
      }
      .form-card {
        padding: 1.25rem 1rem;
        border-radius: 16px;
      }
      .metrics-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
      }
      .metric-card {
        padding: 0.85rem 0.65rem;
        gap: 0.5rem;
      }
      .metric-icon {
        font-size: 1.3rem;
      }
      .metric-value {
        font-size: 1.05rem;
      }
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .form-actions {
        flex-direction: column-reverse;
      }
      .btn {
        width: 100%;
      }
    }

    @media (max-width: 380px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MetasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private metasService = inject(MetasService);
  private supabaseService = inject(SupabaseService);

  metaActual = signal<Meta | null>(null);
  loading = signal(true);
  guardando = signal(false);
  editando = signal(false);
  mensajeExito = signal<string | null>(null);
  error = signal<string | null>(null);

  niveles = [
    { id: 'principiante', label: 'Principiante', desc: 'Empezando desde cero o retomando actividad' },
    { id: 'intermedio', label: 'Intermedio', desc: 'Actividad regular, buscando aumentar volumen' },
    { id: 'avanzado', label: 'Avanzado', desc: 'Base sólida de resistencia, ritmo exigente' }
  ];

  tiposResistencia = [
    'Running',
    'Ciclismo',
    'Natación',
    'Senderismo',
    'Entrenamiento Mixto'
  ];

  form = this.fb.group({
    nivel_inicial: ['principiante', [Validators.required]],
    tipo_resistencia: ['Running', [Validators.required]],
    plazo_semanas: [8, [Validators.required, Validators.min(1), Validators.max(52)]],
    horas_objetivo_semanales: [3, [Validators.required, Validators.min(0.5), Validators.max(40)]],
    fecha_inicio: [new Date().toISOString().substring(0, 10), [Validators.required]]
  });

  async ngOnInit() {
    await this.cargarMeta();
  }

  private async getUsuarioId(): Promise<string> {
    try {
      const { data } = await this.supabaseService.supabase.auth.getSession();
      return data.session?.user?.id ?? 'demo-user';
    } catch {
      return 'demo-user';
    }
  }

  async cargarMeta() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const usuarioId = await this.getUsuarioId();
      const meta = await this.metasService.getMetaActual(usuarioId);
      this.metaActual.set(meta);

      if (meta) {
        this.form.patchValue({
          nivel_inicial: meta.nivel_inicial,
          tipo_resistencia: meta.tipo_resistencia,
          plazo_semanas: meta.plazo_semanas,
          horas_objetivo_semanales: meta.horas_objetivo_semanales,
          fecha_inicio: meta.fecha_inicio || new Date().toISOString().substring(0, 10)
        });
      } else {
        this.editando.set(true);
      }
    } catch {
      this.error.set('No se pudo cargar la meta configurada.');
    } finally {
      this.loading.set(false);
    }
  }

  iniciarEdicion() {
    if (this.metaActual()) {
      const meta = this.metaActual()!;
      this.form.patchValue({
        nivel_inicial: meta.nivel_inicial,
        tipo_resistencia: meta.tipo_resistencia,
        plazo_semanas: meta.plazo_semanas,
        horas_objetivo_semanales: meta.horas_objetivo_semanales,
        fecha_inicio: meta.fecha_inicio || new Date().toISOString().substring(0, 10)
      });
    }
    this.editando.set(true);
    this.mensajeExito.set(null);
  }

  cancelarEdicion() {
    if (this.metaActual()) {
      this.editando.set(false);
      this.error.set(null);
    }
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    try {
      const val = this.form.value;
      const usuarioId = await this.getUsuarioId();
      const metaPayload: Omit<Meta, 'id'> = {
        usuario_id: usuarioId,
        nivel_inicial: val.nivel_inicial!,
        tipo_resistencia: val.tipo_resistencia!,
        plazo_semanas: Number(val.plazo_semanas),
        horas_objetivo_semanales: Number(val.horas_objetivo_semanales),
        fecha_inicio: val.fecha_inicio || new Date().toISOString().substring(0, 10)
      };

      const metaActual = this.metaActual();
      let metaGuardada: Meta;
      if (metaActual?.id) {
        metaGuardada = await this.metasService.updateMeta(metaActual.id, metaPayload);
      } else {
        metaGuardada = await this.metasService.createMeta(metaPayload);
      }

      this.metaActual.set(metaGuardada);
      this.editando.set(false);
      this.mensajeExito.set('¡Tu meta ha sido guardada exitosamente!');
      setTimeout(() => this.mensajeExito.set(null), 4000);
    } catch {
      this.error.set('Error al guardar la meta. Intenta nuevamente.');
    } finally {
      this.guardando.set(false);
    }
  }

  calcularFechaFin(): string {
    const meta = this.metaActual();
    if (!meta || !meta.fecha_inicio) return 'No definida';
    const inicio = new Date(meta.fecha_inicio);
    const fin = new Date(inicio.getTime() + meta.plazo_semanas * 7 * 24 * 60 * 60 * 1000);
    return fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  calcularTotalHoras(): number {
    const meta = this.metaActual();
    if (!meta) return 0;
    return meta.plazo_semanas * meta.horas_objetivo_semanales;
  }
}
