-- ==========================================
-- RESISTE - Esqueleto de Base de Datos (Supabase)
-- ==========================================

-- 1. Tabla de Usuarios (vinculada a Supabase Auth)
create table if not exists public.usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  rol text default 'usuario',
  created_at timestamp default now()
);

-- 2. Tabla de Metas de Entrenamiento (Persona A)
create table if not exists public.metas (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  nivel_inicial text not null,
  tipo_resistencia text not null,
  plazo_semanas int not null,
  horas_objetivo_semanales numeric not null,
  fecha_inicio date default current_date
);

-- 3. Tabla de Tipos de Actividad (Persona B)
create table if not exists public.tipos_actividad (
  id uuid default gen_random_uuid() primary key,
  nombre text not null unique
);

-- 4. Tabla de Sesiones de Entrenamiento (Persona B)
create table if not exists public.sesiones (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  tipo_actividad_id uuid references public.tipos_actividad(id) on delete restrict not null,
  fecha date not null,
  duracion_min int not null,
  esfuerzo_percibido int check (esfuerzo_percibido between 1 and 10),
  notas text
);

-- Datos iniciales por defecto para Tipos de Actividad
insert into public.tipos_actividad (nombre) values 
  ('Correr'),
  ('Trote suave'),
  ('Caminata rápida'),
  ('Ciclismo'),
  ('Natación')
on conflict (nombre) do nothing;
