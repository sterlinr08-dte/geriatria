-- AVÍCOLA ERP — núcleo de datos Fase 3
-- Reconstrucción versionada de la migración aplicada en Supabase el 2026-08-05.
-- Esta migración crea el dominio multiempresa inicial: empresas, sucursales,
-- granjas, galpones, razas, lotes y producción diaria.

create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  razon_social text,
  rnc text,
  telefono text,
  email text,
  direccion text,
  moneda text not null default 'DOP',
  zona_horaria text not null default 'America/Santo_Domingo',
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.empresa_usuarios (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'consulta'
    check (rol in ('propietario','administrador','supervisor','operador','consulta')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (empresa_id, usuario_id)
);

create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  codigo text not null,
  nombre text not null,
  telefono text,
  direccion text,
  ciudad text,
  provincia text,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, codigo)
);

create table if not exists public.granjas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  sucursal_id uuid references public.sucursales(id) on delete restrict,
  codigo text not null,
  nombre text not null,
  direccion text,
  municipio text,
  provincia text,
  latitud numeric,
  longitud numeric,
  administrador_id uuid references public.empleados(id) on delete set null,
  foto_url text,
  estado text not null default 'ACTIVA'
    check (estado in ('ACTIVA','INACTIVA','MANTENIMIENTO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, codigo)
);

create table if not exists public.galpones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  granja_id uuid not null references public.granjas(id) on delete restrict,
  codigo text not null,
  nombre text not null,
  capacidad integer not null check (capacidad > 0),
  tipo_sistema text not null default 'PISO'
    check (tipo_sistema in ('PISO','JAULA','AVIARIO','OTRO')),
  ventilacion text,
  encargado_id uuid references public.empleados(id) on delete set null,
  foto_url text,
  estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO','INACTIVO','MANTENIMIENTO','VACIO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (granja_id, codigo)
);

create table if not exists public.razas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  nombre text not null,
  linea_genetica text,
  proveedor_recomendado text,
  postura_objetivo numeric check (postura_objetivo between 0 and 100),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nombre)
);

create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  granja_id uuid not null references public.granjas(id) on delete restrict,
  galpon_id uuid references public.galpones(id) on delete restrict,
  raza_id uuid references public.razas(id) on delete restrict,
  proveedor_id uuid references public.proveedores(id) on delete restrict,
  codigo text not null,
  fecha_ingreso date not null,
  fecha_nacimiento date,
  cantidad_inicial integer not null check (cantidad_inicial > 0),
  cantidad_actual integer not null check (cantidad_actual >= 0),
  costo_total numeric not null default 0 check (costo_total >= 0),
  fecha_descarte_estimada date,
  fecha_descarte_real date,
  foto_url text,
  estado text not null default 'ACTIVO'
    check (estado in ('ACTIVO','DESARROLLO','PRODUCCION','DESCARTADO','CERRADO')),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (empresa_id, codigo)
);

create table if not exists public.produccion_diaria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete restrict,
  granja_id uuid not null references public.granjas(id) on delete restrict,
  galpon_id uuid not null references public.galpones(id) on delete restrict,
  lote_id uuid not null references public.lotes(id) on delete restrict,
  fecha date not null default current_date,
  gallinas_vivas integer not null check (gallinas_vivas >= 0),
  huevos_recolectados integer not null default 0 check (huevos_recolectados >= 0),
  huevos_buenos integer not null default 0 check (huevos_buenos >= 0),
  huevos_rotos integer not null default 0 check (huevos_rotos >= 0),
  huevos_sucios integer not null default 0 check (huevos_sucios >= 0),
  huevos_deformes integer not null default 0 check (huevos_deformes >= 0),
  huevos_descartados integer not null default 0 check (huevos_descartados >= 0),
  observaciones text,
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, lote_id, fecha),
  check (huevos_buenos + huevos_rotos + huevos_sucios + huevos_deformes + huevos_descartados <= huevos_recolectados)
);

create index if not exists empresa_usuarios_usuario_idx on public.empresa_usuarios(usuario_id);
create index if not exists sucursales_empresa_idx on public.sucursales(empresa_id);
create index if not exists granjas_empresa_idx on public.granjas(empresa_id);
create index if not exists granjas_sucursal_idx on public.granjas(sucursal_id);
create index if not exists galpones_empresa_idx on public.galpones(empresa_id);
create index if not exists galpones_granja_idx on public.galpones(granja_id);
create index if not exists razas_empresa_idx on public.razas(empresa_id);
create index if not exists lotes_empresa_idx on public.lotes(empresa_id);
create index if not exists lotes_granja_idx on public.lotes(granja_id);
create index if not exists lotes_galpon_idx on public.lotes(galpon_id);
create index if not exists produccion_empresa_fecha_idx on public.produccion_diaria(empresa_id, fecha desc);
create index if not exists produccion_galpon_fecha_idx on public.produccion_diaria(galpon_id, fecha desc);
create index if not exists produccion_lote_fecha_idx on public.produccion_diaria(lote_id, fecha desc);

alter table public.empresas enable row level security;
alter table public.empresa_usuarios enable row level security;
alter table public.sucursales enable row level security;
alter table public.granjas enable row level security;
alter table public.galpones enable row level security;
alter table public.razas enable row level security;
alter table public.lotes enable row level security;
alter table public.produccion_diaria enable row level security;

-- Las políticas iniciales se endurecen y sustituyen en la migración
-- 20260805010321_avicola_phase_3_hardening.sql.
