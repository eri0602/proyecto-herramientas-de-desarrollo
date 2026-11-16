import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MetasService } from '../../core/services/metas.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Meta } from '../../core/models/meta.model';

interface DiaPlan {
  dia: string;
  tipo: string;
  duracionMin: number;
  intensidad: string;
  descripcion: string;
  esDescanso: boolean;
}

interface SemanaProgresion {
  semana: number;
  horasSugeridas: number;
  enfoque: string;
  estado: 'pasada' | 'actual' | 'futura';
}

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
          <p class="subtitle">Define tu plan de resistencia física y monitorea tu progresión inteligente</p>
        </div>
        @if (!loading() && metaActual() && !editando()) {
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="iniciarEdicion()">
              <i class="bi bi-pencil-square"></i>
              <span>Modificar Meta</span>
            </button>
            <a routerLink="/sesiones" class="btn btn-primary-outline">
              <i class="bi bi-plus-circle"></i>
              <span>Entrenar Hoy</span>
            </a>
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

        <!-- Vista Principal / Meta Activa -->
        @if (metaActual() && !editando()) {
          <!-- Selector de Pestañas -->
          <div class="tabs-nav">
            <button
              class="tab-btn"
              [class.active]="tabActiva() === 'resumen'"
              (click)="tabActiva.set('resumen')"
            >
              <i class="bi bi-card-checklist"></i> Resumen de Meta
            </button>
            <button
              class="tab-btn"
              [class.active]="tabActiva() === 'rutina'"
              (click)="tabActiva.set('rutina')"
            >
              <i class="bi bi-calendar-week"></i> Rutina Semanal Sugerida
            </button>
            <button
              class="tab-btn"
              [class.active]="tabActiva() === 'progresion'"
              (click)="tabActiva.set('progresion')"
            >
              <i class="bi bi-graph-up-arrow"></i> Progresión por Semanas
            </button>
          </div>

          <!-- TAB 1: RESUMEN DE META -->
          @if (tabActiva() === 'resumen') {
            <div class="meta-dashboard">
              <!-- Tarjeta principal hero -->
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
                  <span class="badge badge-phase">
                    <i class="bi bi-compass"></i> {{ faseActual().nombre }}
                  </span>
                </div>

                <h2 class="hero-title">
                  Objetivo: {{ metaActual()?.horas_objetivo_semanales }}h semanales
                </h2>
                <p class="hero-description">
                  Programa diseñado para un plazo de <strong>{{ metaActual()?.plazo_semanas }} semanas</strong>.
                  Actualmente te encuentras en la <strong>Semana {{ semanaActual() }}</strong>
                  ({{ porcentajeTiempoTranscurrido() }}% del tiempo transcurrido).
                </p>

                <!-- Barra de progreso temporal de la meta -->
                <div class="progress-container">
                  <div class="progress-labels">
                    <span>Inicio: {{ metaActual()?.fecha_inicio }}</span>
                    <span>Semana {{ semanaActual() }} de {{ metaActual()?.plazo_semanas }}</span>
                    <span>Fin: {{ calcularFechaFin() }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      [style.width.%]="porcentajeTiempoTranscurrido()"
                    ></div>
                  </div>
                </div>

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
                    <span class="metric-icon"><i class="bi bi-calendar-check"></i></span>
                    <div class="metric-info">
                      <span class="metric-value">Sem. {{ semanaActual() }}/{{ metaActual()?.plazo_semanas }}</span>
                      <span class="metric-label">Semana actual</span>
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
                    <span class="metric-icon"><i class="bi bi-hourglass-split"></i></span>
                    <div class="metric-info">
                      <span class="metric-value">{{ diasRestantes() }} d</span>
                      <span class="metric-label">Días restantes</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Consejos de preparación según nivel -->
              <div class="info-card">
                <h3><i class="bi bi-lightbulb-fill"></i> Recomendación de ritmo para tu fase actual</h3>
                <p class="info-text">
                  Estás en la <strong>{{ faseActual().nombre }}</strong>: {{ faseActual().descripcion }}.
                  Con un objetivo de <strong>{{ metaActual()?.horas_objetivo_semanales }} horas semanales</strong>,
                  te recomendamos priorizar la constancia antes que la velocidad.
                </p>
              </div>
            </div>
          }

          <!-- TAB 2: RUTINA SEMANAL SUGERIDA -->
          @if (tabActiva() === 'rutina') {
            <div class="rutina-container">
              <div class="rutina-header-card">
                <div>
                  <h3><i class="bi bi-calendar3"></i> Microciclo Semanal Adaptado</h3>
                  <p class="text-muted">
                    Distribución de carga recomendada para <strong>{{ metaActual()?.horas_objetivo_semanales }}h</strong> 
                    en nivel <strong>{{ metaActual()?.nivel_inicial | titlecase }}</strong>.
                  </p>
                </div>
                <div class="rutina-badge">
                  <span>{{ calcularSesionesPorSemana() }} sesiones activas / sem</span>
                </div>
              </div>

              <div class="dias-grid">
                @for (d of rutinaSugerida(); track d.dia) {
                  <div class="dia-card" [class.dia-descanso]="d.esDescanso">
                    <div class="dia-header">
                      <span class="dia-nombre">{{ d.dia }}</span>
                      <span class="dia-badge" [class.badge-rest]="d.esDescanso">
                        {{ d.esDescanso ? 'Recuperación' : d.duracionMin + ' min' }}
                      </span>
                    </div>
                    <h4 class="dia-tipo">{{ d.tipo }}</h4>
                    <p class="dia-desc">{{ d.descripcion }}</p>
                    <div class="dia-footer">
                      <span class="intensidad-tag">
                        <i class="bi bi-speedometer2"></i> {{ d.intensidad }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <div class="info-card mt-3">
                <h3><i class="bi bi-shield-check"></i> Regla de oro de la resistencia</h3>
                <p class="info-text">
                  El descanso es cuando tus músculos y sistema cardiovascular se adaptan y fortalecen.
                  Nunca sustituyas un día de descanso programado por una sesión intensa si sientes fatiga muscular acumulada.
                </p>
              </div>
            </div>
          }

          <!-- TAB 3: PROGRESIÓN POR SEMANAS -->
          @if (tabActiva() === 'progresion') {
            <div class="progresion-container">
              <div class="progresion-header-card">
                <h3><i class="bi bi-stairs"></i> Sobrecarga Progresiva del Plan</h3>
                <p class="text-muted">
                  Evolución sugerida del volumen semanal (principio fisiológico de progresión gradual) para 
                  alcanzar tu meta sin sobreentrenar.
                </p>
              </div>

              <div class="semanas-table-wrapper">
                <table class="semanas-table">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Volumen Sugerido</th>
                      <th>Enfoque Fisiológico</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of semanasProgresion(); track s.semana) {
                      <tr [class.fila-actual]="s.estado === 'actual'">
                        <td>
                          <span class="sem-badge" [class.sem-actual]="s.estado === 'actual'">
                            Semana {{ s.semana }}
                          </span>
                        </td>
                        <td>
                          <strong>{{ s.horasSugeridas }} h</strong>
                          <span class="porc-txt">({{ calcularPorcentajeMeta(s.horasSugeridas) }}%)</span>
                        </td>
                        <td>{{ s.enfoque }}</td>
                        <td>
                          @if (s.estado === 'pasada') {
                            <span class="tag-status tag-done"><i class="bi bi-check-all"></i> Pasada</span>
                          } @else if (s.estado === 'actual') {
                            <span class="tag-status tag-current"><i class="bi bi-record-circle-fill"></i> En Curso</span>
                          } @else {
                            <span class="tag-status tag-pending"><i class="bi bi-clock"></i> Planificada</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
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
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1.25rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
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

    /* Tabs Navigation */
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.35rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 1.75rem;
      overflow-x: auto;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 0.65rem 1.15rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    /* Hero Meta Card */
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

    .badge-phase {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
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
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    /* Progress Bar */
    .progress-container {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.75rem;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 0.6rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      border-radius: 6px;
      transition: width 0.4s ease;
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

    .mt-3 {
      margin-top: 1.5rem;
    }

    /* Rutina Semanal Cards */
    .rutina-header-card, .progresion-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .rutina-header-card h3, .progresion-header-card h3 {
      font-size: 1.15rem;
      color: #f8fafc;
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .rutina-header-card h3 i, .progresion-header-card h3 i {
      color: #38bdf8;
    }

    .text-muted {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .rutina-badge span {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      padding: 0.4rem 0.9rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .dias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }

    .dia-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
    }

    .dia-card:hover {
      border-color: rgba(56, 189, 248, 0.3);
      transform: translateY(-2px);
    }

    .dia-card.dia-descanso {
      background: rgba(255, 255, 255, 0.015);
      border-color: rgba(255, 255, 255, 0.04);
      opacity: 0.85;
    }

    .dia-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dia-nombre {
      font-weight: 700;
      color: #38bdf8;
      font-size: 0.95rem;
    }

    .dia-badge {
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(56, 189, 248, 0.15);
      color: #7dd3fc;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
    }

    .dia-badge.badge-rest {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
    }

    .dia-tipo {
      font-size: 1rem;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0;
    }

    .dia-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.45;
      flex: 1;
    }

    .dia-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.6rem;
    }

    .intensidad-tag {
      font-size: 0.75rem;
      color: #cbd5e1;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Progresión Table */
    .semanas-table-wrapper {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      overflow-x: auto;
    }

    .semanas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      text-align: left;
    }

    .semanas-table th {
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.02);
      color: #64748b;
      font-weight: 600;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .semanas-table td {
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }

    .fila-actual {
      background: rgba(56, 189, 248, 0.08);
    }

    .sem-badge {
      font-weight: 600;
      color: #e2e8f0;
    }

    .sem-badge.sem-actual {
      color: #38bdf8;
    }

    .porc-txt {
      font-size: 0.775rem;
      color: #64748b;
      margin-left: 0.35rem;
    }

    .tag-status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
    }

    .tag-done {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .tag-current {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }

    .tag-pending {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
    }

    /* Forms */
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
      text-decoration: none;
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

    .btn-primary-outline {
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }

    .btn-primary-outline:hover {
      background: rgba(56, 189, 248, 0.22);
      color: #f8fafc;
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
      .header-actions {
        flex-direction: column;
        width: 100%;
      }
      .header-actions .btn {
        width: 100%;
        text-align: center;
        justify-content: center;
      }
      .hero-meta-card, .form-card {
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

  // Pestaña activa
  tabActiva = signal<'resumen' | 'rutina' | 'progresion'>('resumen');

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

  // ===== Computed Signals de Progresión Temporal =====
  diasTranscurridos = computed(() => {
    const meta = this.metaActual();
    if (!meta || !meta.fecha_inicio) return 0;
    const inicio = new Date(meta.fecha_inicio).getTime();
    const hoy = new Date().getTime();
    const diff = Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  });

  totalDiasPlan = computed(() => {
    const meta = this.metaActual();
    if (!meta) return 56;
    return meta.plazo_semanas * 7;
  });

  diasRestantes = computed(() => {
    const total = this.totalDiasPlan();
    const trans = this.diasTranscurridos();
    return Math.max(0, total - trans);
  });

  semanaActual = computed(() => {
    const meta = this.metaActual();
    if (!meta) return 1;
    const sem = Math.floor(this.diasTranscurridos() / 7) + 1;
    return Math.min(sem, meta.plazo_semanas);
  });

  porcentajeTiempoTranscurrido = computed(() => {
    const total = this.totalDiasPlan();
    if (total === 0) return 0;
    return Math.min(100, Math.round((this.diasTranscurridos() / total) * 100));
  });

  faseActual = computed(() => {
    const porc = this.porcentajeTiempoTranscurrido();
    if (porc <= 33) {
      return {
        nombre: 'Fase de Adaptación y Base',
        descripcion: 'Construcción de resistencia aeróbica inicial, adaptación muscular y control de ritmo cómodo.'
      };
    } else if (porc <= 75) {
      return {
        nombre: 'Fase de Desarrollo y Carga',
        descripcion: 'Incremento sostenido de volumen, consolidación de la capacidad pulmonar y eficiencia energética.'
      };
    } else {
      return {
        nombre: 'Fase Pico y Consolidación',
        descripcion: 'Máxima resistencia alcanzada. Mantén la constancia y realiza descargas controladas.'
      };
    }
  });

  // ===== Computed Rutina Semanal Sugerida =====
  rutinaSugerida = computed((): DiaPlan[] => {
    const meta = this.metaActual();
    const horas = meta?.horas_objetivo_semanales ?? 3;
    const disciplina = meta?.tipo_resistencia ?? 'Running';
    const nivel = meta?.nivel_inicial ?? 'principiante';

    // Minutos totales y cálculo de sesiones
    const totalMinutos = Math.round(horas * 60);

    if (nivel === 'principiante') {
      const duracionSesion = Math.round(totalMinutos / 3);
      return [
        {
          dia: 'Lunes',
          tipo: `${disciplina} Base`,
          duracionMin: duracionSesion,
          intensidad: 'Esfuerzo 4-5/10 (Zona 2)',
          descripcion: 'Ritmo conversacional suave para construir mitocondrias y base aeróbica.',
          esDescanso: false
        },
        {
          dia: 'Martes',
          tipo: 'Recuperación Activa',
          duracionMin: 0,
          intensidad: 'Esfuerzo 1-2/10',
          descripcion: 'Caminata ligera, movilidad articular o descanso total.',
          esDescanso: true
        },
        {
          dia: 'Miércoles',
          tipo: `${disciplina} Progresivo`,
          duracionMin: duracionSesion,
          intensidad: 'Esfuerzo 5-6/10',
          descripcion: 'Inicia muy suave y acelera levemente en los últimos 10 minutos.',
          esDescanso: false
        },
        {
          dia: 'Jueves',
          tipo: 'Descanso Total',
          duracionMin: 0,
          intensidad: 'Reposo',
          descripcion: 'Recuperación neuromuscular y descanso reparador.',
          esDescanso: true
        },
        {
          dia: 'Viernes',
          tipo: 'Movilidad o Yoga',
          duracionMin: 0,
          intensidad: 'Estiramientos',
          descripcion: 'Estiramientos estáticos y foam roller para descargar piernas.',
          esDescanso: true
        },
        {
          dia: 'Sábado',
          tipo: `Tirada de Fondo (${disciplina})`,
          duracionMin: duracionSesion,
          intensidad: 'Esfuerzo 4-5/10',
          descripcion: 'La sesión más larga de la semana. Mantén ritmo constante y sin prisa.',
          esDescanso: false
        },
        {
          dia: 'Domingo',
          tipo: 'Descanso Semanal',
          duracionMin: 0,
          intensidad: 'Reposo',
          descripcion: 'Día libre para asimilar el entrenamiento de la semana.',
          esDescanso: true
        }
      ];
    } else {
      // Intermedio / Avanzado: 4 sesiones activas
      const duracionBase = Math.round((totalMinutos * 0.22));
      const duracionFondo = Math.round((totalMinutos * 0.34));
      return [
        {
          dia: 'Lunes',
          tipo: `${disciplina} Aeróbico Corto`,
          duracionMin: duracionBase,
          intensidad: 'Esfuerzo 5/10',
          descripcion: 'Activación semanal a ritmo continuo y cómodo.',
          esDescanso: false
        },
        {
          dia: 'Martes',
          tipo: 'Descanso Activo',
          duracionMin: 0,
          intensidad: 'Reposo',
          descripcion: 'Movilidad de cadera, tobillos y estiramientos.',
          esDescanso: true
        },
        {
          dia: 'Miércoles',
          tipo: `${disciplina} a Ritmo Medio`,
          duracionMin: duracionBase,
          intensidad: 'Esfuerzo 6-7/10',
          descripcion: 'Bloques continuos a ritmo moderadamente exigente.',
          esDescanso: false
        },
        {
          dia: 'Jueves',
          tipo: 'Recuperación / Core',
          duracionMin: 0,
          intensidad: 'Fuerza suave',
          descripcion: 'Trabajo preventivo de abdomen, lumbares y glúteos.',
          esDescanso: true
        },
        {
          dia: 'Viernes',
          tipo: `${disciplina} con Cambios de Ritmo`,
          duracionMin: duracionBase,
          intensidad: 'Esfuerzo 7-8/10',
          descripcion: 'Fartlek o intervalos cortos para elevar el umbral anaeróbico.',
          esDescanso: false
        },
        {
          dia: 'Sábado',
          tipo: `Tirada Larga de Resistencia`,
          duracionMin: duracionFondo,
          intensidad: 'Esfuerzo 5-6/10',
          descripcion: 'Sesión principal de fondo para entrenar la resistencia mental y física.',
          esDescanso: false
        },
        {
          dia: 'Domingo',
          tipo: 'Descanso Completo',
          duracionMin: 0,
          intensidad: 'Reposo',
          descripcion: 'Nutrición, hidratación y sueño para empezar el nuevo ciclo al 100%.',
          esDescanso: true
        }
      ];
    }
  });

  // ===== Computed Progresión de Volumen por Semanas =====
  semanasProgresion = computed((): SemanaProgresion[] => {
    const meta = this.metaActual();
    if (!meta) return [];

    const totalSem = meta.plazo_semanas;
    const horasObjetivo = meta.horas_objetivo_semanales;
    const semAct = this.semanaActual();
    const resultado: SemanaProgresion[] = [];

    for (let i = 1; i <= totalSem; i++) {
      let factor = 0.75 + (i / totalSem) * 0.25; // escala desde 75% hasta 100%
      // Cada 4ta semana una descarga ligera (90% del factor anterior)
      if (i % 4 === 0 && i !== totalSem) {
        factor *= 0.85;
      }
      const horasSug = +(horasObjetivo * factor).toFixed(1);

      let enfoque = 'Adaptación y volumen base';
      if (i % 4 === 0 && i !== totalSem) {
        enfoque = 'Semana de descarga / asimilación';
      } else if (i > totalSem * 0.7) {
        enfoque = 'Consolidación y ritmo objetivo';
      } else if (i > totalSem * 0.35) {
        enfoque = 'Carga progresiva de resistencia';
      }

      let estado: 'pasada' | 'actual' | 'futura' = 'futura';
      if (i < semAct) estado = 'pasada';
      else if (i === semAct) estado = 'actual';

      resultado.push({
        semana: i,
        horasSugeridas: horasSug,
        enfoque,
        estado
      });
    }

    return resultado;
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

  calcularSesionesPorSemana(): number {
    return this.metaActual()?.nivel_inicial === 'principiante' ? 3 : 4;
  }

  calcularPorcentajeMeta(horasSugeridas: number): number {
    const meta = this.metaActual();
    if (!meta || !meta.horas_objetivo_semanales) return 100;
    return Math.round((horasSugeridas / meta.horas_objetivo_semanales) * 100);
  }
}
