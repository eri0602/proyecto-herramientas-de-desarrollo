# AGENTS.md — Resiste (app de seguimiento de entrenamiento personal)

## Contexto del proyecto

Proyecto para el curso de Herramientas de Desarrollo (UTP), evaluado principalmente por el uso correcto de Git/commits. Se desarrolla en pareja durante 17-18 semanas, con avance real de ambos integrantes cada semana.

Problema real que resuelve: ayudar a alguien que arranca en nivel principiante a llegar a una meta de resistencia física (ej. correr) en un plazo definido, registrando sesiones de entrenamiento y viendo su progreso real contra el objetivo. No es un tracker de fitness genérico con mil funciones — es una sola cosa hecha bien.

## Stack

- Frontend: Angular (standalone components, sin NgModules, usar signals)
- Sin backend propio — conexión directa a Supabase (Postgres + Auth) vía `@supabase/supabase-js`
- Estilos: a definir por el equipo (Tailwind o Bootstrap)
- Deploy: Vercel o Netlify

## Modelo de datos (Supabase)

```sql
create table usuarios (
  id uuid references auth.users primary key,
  nombre text not null,
  rol text default 'usuario',
  created_at timestamp default now()
);

create table metas (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references usuarios(id) not null,
  nivel_inicial text not null,
  tipo_resistencia text not null,
  plazo_semanas int not null,
  horas_objetivo_semanales numeric not null,
  fecha_inicio date default current_date
);

create table tipos_actividad (
  id uuid default gen_random_uuid() primary key,
  nombre text not null unique
);

create table sesiones (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references usuarios(id) not null,
  tipo_actividad_id uuid references tipos_actividad(id) not null,
  fecha date not null,
  duracion_min int not null,
  esfuerzo_percibido int check (esfuerzo_percibido between 1 and 10),
  notas text
);
```

## Estructura de carpetas

```
src/app/
├── core/            # cliente Supabase, guards, interceptors
├── shared/          # componentes reutilizables
├── features/
│   ├── auth/
│   ├── metas/
│   ├── tipos-actividad/
│   ├── sesiones/
│   └── dashboard/
└── app.routes.ts
```

## División del equipo

- Persona A: `auth` + `metas`
- Persona B: `tipos-actividad` + `sesiones` + `dashboard`
- Cada quien trabaja solo dentro de su carpeta de módulo para minimizar conflictos de merge. Antes de tocar el módulo del otro, avisar.

## Flujo de Git (esto es lo que califica el curso)

- `main` protegida — solo entra código que funciona
- Una rama por feature: `feature/auth`, `feature/metas`, `feature/tipos-actividad`, `feature/sesiones`, `feature/dashboard`
- Commits con formato convencional: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Cada commit referencia su issue de GitHub Projects, ej: `feat: login con Supabase (#12)`
- Merge por Pull Request, aunque el equipo sea de 2 personas — deja historial de revisión
- Mínimo un commit real por semana por persona — nunca acumular todo para el final
- Tag/release cada 3-4 semanas como hito

## Roadmap semana por semana

_(Ajustado: el proyecto arranca recién en la semana 4 — semanas 1-3 sin avance. Roadmap original comprimido para que quepa en las semanas restantes; Docker queda fuera salvo que el curso lo pida explícitamente.)_

| Sem | Persona A (Auth + Metas)                                                              | Persona B (Sesiones + Dashboard)                     |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 4   | Setup conjunto: scaffold Angular, carpetas, tablas en Supabase, cada uno crea su rama | (mismo, en conjunto)                                 |
| 5   | AuthService + Login/Registro                                                          | CRUD `tipos_actividad` + formulario registrar sesión |
| 6   | Guard de rutas + formulario "Mi Meta" (crear)                                         | Historial de sesiones (listar + filtrar)             |
| 7   | Editar meta + mini resumen de perfil                                                  | Editar/eliminar sesión                               |
| 8   | Exponer `metas` para el dashboard + validaciones                                      | Dashboard: horas acumuladas vs meta + racha          |
| 9   | Refinar UI + responsive                                                               | Dashboard: tendencia de esfuerzo + responsive        |
| 10  | Tests unitarios: auth, metas                                                          | Tests unitarios: sesiones, dashboard                 |
| 11  | Tests de integración + accesibilidad                                                  | Tests de integración + accesibilidad                 |
| 12  | CI con GitHub Actions (lint + test en cada push)                                      | (mismo, en conjunto)                                 |
| 13  | README + documentación técnica                                                        | Manual de usuario / capturas                         |
| 14  | Corrección de bugs, pulido general                                                    | Corrección de bugs, pulido general                   |
| 15  | Deploy a producción (Vercel/Netlify)                                                  | Deploy a producción (Vercel/Netlify)                 |
| 16  | Buffer / ajustes finales, revisión cruzada                                            | Buffer / ajustes finales, revisión cruzada           |
| 17  | Preparación de demo y entrega final                                                   | Preparación de demo y entrega final                  |
| 18  | Margen extra por si algo se atrasa                                                    | Margen extra por si algo se atrasa                   |

## Reglas para el agente

- No generar código de golpe para varias semanas de una vez; avanzar módulo por módulo, semana por semana, siguiendo el roadmap
- Cada tarea completada debe terminar en un commit real — no dejar cambios sin commitear
- Respetar la convención de nombres ya establecida (usuarios, metas, sesiones, tipos_actividad)
- No tocar el módulo asignado a la otra persona sin avisar primero
