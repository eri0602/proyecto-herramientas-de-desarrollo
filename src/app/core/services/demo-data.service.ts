import { Injectable } from '@angular/core';
import { Meta } from '../models/meta.model';
import { Sesion } from '../models/sesion.model';
import { TipoActividad } from '../models/tipo-actividad.model';

const STORAGE_METAS = 'resiste_metas';
const STORAGE_SESIONES = 'resiste_sesiones';
const STORAGE_TIPOS = 'resiste_tipos_actividad';

@Injectable({
  providedIn: 'root'
})
export class DemoDataService {
  /**
   * Genera una fecha YYYY-MM-DD relativa a hoy (hace N días)
   */
  private diasAtras(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().substring(0, 10);
  }

  getDemoTipos(): TipoActividad[] {
    return [
      { id: 'default_1', nombre: 'Carrera' },
      { id: 'default_2', nombre: 'Caminata' },
      { id: 'default_3', nombre: 'Ciclismo' },
      { id: 'default_4', nombre: 'Natación' },
      { id: 'default_5', nombre: 'Funcional' }
    ];
  }

  getDemoMeta(usuarioId = 'demo-user'): Meta {
    return {
      id: 'meta_demo_01',
      usuario_id: usuarioId,
      nivel_inicial: 'principiante',
      tipo_resistencia: 'Running',
      plazo_semanas: 8,
      horas_objetivo_semanales: 3.5,
      fecha_inicio: this.diasAtras(18) // Semana 3 de 8 (progreso visible)
    };
  }

  getDemoSesiones(usuarioId = 'demo-user'): Sesion[] {
    return [
      {
        id: 'ses_demo_07',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_3', // Ciclismo
        fecha: this.diasAtras(1),
        duracion_min: 50,
        esfuerzo_percibido: 6,
        notas: 'Rodaje regenerativo nocturno en bicicleta para soltar piernas.'
      },
      {
        id: 'ses_demo_06',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_1', // Carrera
        fecha: this.diasAtras(3),
        duracion_min: 75,
        esfuerzo_percibido: 7,
        notas: 'Tirada larga dominical de fondo, 13 km completados con ritmo progresivo y buenas sensaciones en rodilla.'
      },
      {
        id: 'ses_demo_05',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_4', // Natación
        fecha: this.diasAtras(5),
        duracion_min: 45,
        esfuerzo_percibido: 6,
        notas: 'Sesión de nado continuo en piscina, trabajo de brazada y respiración bilateral.'
      },
      {
        id: 'ses_demo_04',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_5', // Funcional
        fecha: this.diasAtras(7),
        duracion_min: 35,
        esfuerzo_percibido: 5,
        notas: 'Entrenamiento de fuerza y estabilidad de core para prevenir sobrecarga lumbar.'
      },
      {
        id: 'ses_demo_03',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_1', // Carrera
        fecha: this.diasAtras(9),
        duracion_min: 40,
        esfuerzo_percibido: 8,
        notas: 'Series de 400m en pista de atletismo, pulsaciones altas en el último bloque.'
      },
      {
        id: 'ses_demo_02',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_3', // Ciclismo
        fecha: this.diasAtras(12),
        duracion_min: 60,
        esfuerzo_percibido: 6,
        notas: 'Salida matutina en ruta plana por la costa, cadencia constante y buena recuperación.'
      },
      {
        id: 'ses_demo_01',
        usuario_id: usuarioId,
        tipo_actividad_id: 'default_1', // Carrera
        fecha: this.diasAtras(14),
        duracion_min: 45,
        esfuerzo_percibido: 5,
        notas: 'Primera tirada suave en el parque, ritmo aeróbico cómodo sin fatiga.'
      }
    ];
  }

  /**
   * Carga los datos de demostración en localStorage (si no existen o forzando recarga)
   */
  cargarDatosDemo(forzar = false): void {
    if (forzar || !localStorage.getItem(STORAGE_METAS)) {
      localStorage.setItem(STORAGE_METAS, JSON.stringify([this.getDemoMeta()]));
    }
    if (forzar || !localStorage.getItem(STORAGE_SESIONES)) {
      localStorage.setItem(STORAGE_SESIONES, JSON.stringify(this.getDemoSesiones()));
    }
    if (forzar || !localStorage.getItem(STORAGE_TIPOS)) {
      localStorage.setItem(STORAGE_TIPOS, JSON.stringify(this.getDemoTipos()));
    }
  }
}

