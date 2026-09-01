import { TipoActividad } from './tipo-actividad.model';

export interface Sesion {
  id?: string;
  usuario_id: string;
  tipo_actividad_id: string;
  fecha: string;
  duracion_min: number;
  esfuerzo_percibido: number;
  notas?: string | null;
  tipos_actividad?: TipoActividad;
}
