begin;

alter table public.empresa_usuarios
  drop constraint if exists empresa_usuarios_rol_check;

alter table public.empresa_usuarios
  add constraint empresa_usuarios_rol_check check (
    rol = any (array[
      'propietario','administrador','supervisor','produccion','empaque',
      'veterinario','inventario','ventas','cobranzas','compras','consulta'
    ]::text[])
  );

create table public.proveedores_avicola (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  codigo text,
  nombre text not null,
  identificacion text,
  contacto_nombre text,
  telefono text,
  correo text,
  direccion text,
  dias_credito integer not null default 0 check (dias_credito between 0 and 365),
  limite_credito numeric(14,2) not null default 0 check (limite_credito >= 0),
  activo boolean not null default true,
  notas text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, empresa_id),
  check (length(trim(nombre)) >= 2),
  check (correo is null or position('@' in correo) > 1)
);

create unique index proveedores_avicola_nombre_activo_uq
  on public.proveedores_avicola(empresa_id, lower(trim(nombre)))
  where deleted_at is null;

create unique index proveedores_avicola_codigo_activo_uq
  on public.proveedores_avicola(empresa_id, lower(trim(codigo)))
  where codigo is not null and deleted_at is null;

create index proveedores_avicola_empresa_activo_idx
  on public.proveedores_avicola(empresa_id, activo, nombre)
  where deleted_at is null;

create trigger proveedores_avicola_updated_at_trg
before update on public.proveedores_avicola
for each row execute function private.avicola_set_updated_at();

create trigger proveedores_avicola_auditoria_trg
after insert or update or delete on public.proveedores_avicola
for each row execute function public.fn_auditoria();

alter table public.proveedores_avicola enable row level security;

create policy proveedores_avicola_select on public.proveedores_avicola
for select to authenticated
using (exists(
  select 1 from public.empresa_usuarios eu
  where eu.empresa_id=proveedores_avicola.empresa_id
    and eu.usuario_id=auth.uid()
    and eu.activo=true
));

grant select on public.proveedores_avicola to authenticated;
revoke insert,update,delete,truncate on public.proveedores_avicola from authenticated,anon;

create or replace function public.avicola_crear_proveedor(
  p_empresa_id uuid,
  p_nombre text,
  p_codigo text default null,
  p_identificacion text default null,
  p_contacto_nombre text default null,
  p_telefono text default null,
  p_correo text default null,
  p_direccion text default null,
  p_dias_credito integer default 0,
  p_limite_credito numeric default 0,
  p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id=p_empresa_id and eu.usuario_id=auth.uid()
      and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','compras')
  ) then raise exception 'No autorizado para crear proveedores.' using errcode='42501'; end if;

  if p_nombre is null or length(trim(p_nombre)) < 2 then
    raise exception 'El nombre del proveedor es obligatorio.' using errcode='23514';
  end if;
  if coalesce(p_dias_credito,0) not between 0 and 365 then
    raise exception 'Los días de crédito deben estar entre 0 y 365.' using errcode='23514';
  end if;
  if coalesce(p_limite_credito,0) < 0 then
    raise exception 'El límite de crédito no puede ser negativo.' using errcode='23514';
  end if;

  insert into public.proveedores_avicola(
    empresa_id,codigo,nombre,identificacion,contacto_nombre,telefono,correo,direccion,
    dias_credito,limite_credito,notas,created_by
  ) values (
    p_empresa_id,nullif(trim(p_codigo),''),trim(p_nombre),nullif(trim(p_identificacion),''),
    nullif(trim(p_contacto_nombre),''),nullif(trim(p_telefono),''),lower(nullif(trim(p_correo),'')),
    nullif(trim(p_direccion),''),coalesce(p_dias_credito,0),round(coalesce(p_limite_credito,0),2),
    nullif(trim(p_notas),''),auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.avicola_actualizar_proveedor(
  p_proveedor_id uuid,
  p_nombre text,
  p_codigo text default null,
  p_identificacion text default null,
  p_contacto_nombre text default null,
  p_telefono text default null,
  p_correo text default null,
  p_direccion text default null,
  p_dias_credito integer default 0,
  p_limite_credito numeric default 0,
  p_notas text default null
)
returns void
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_proveedor public.proveedores_avicola%rowtype;
begin
  select * into v_proveedor from public.proveedores_avicola
  where id=p_proveedor_id and deleted_at is null for update;
  if not found then raise exception 'Proveedor no encontrado.' using errcode='23503'; end if;

  if not exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id=v_proveedor.empresa_id and eu.usuario_id=auth.uid()
      and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','compras')
  ) then raise exception 'No autorizado para editar proveedores.' using errcode='42501'; end if;

  if p_nombre is null or length(trim(p_nombre)) < 2 then
    raise exception 'El nombre del proveedor es obligatorio.' using errcode='23514';
  end if;
  if coalesce(p_dias_credito,0) not between 0 and 365 then
    raise exception 'Los días de crédito deben estar entre 0 y 365.' using errcode='23514';
  end if;
  if coalesce(p_limite_credito,0) < 0 then
    raise exception 'El límite de crédito no puede ser negativo.' using errcode='23514';
  end if;

  update public.proveedores_avicola set
    codigo=nullif(trim(p_codigo),''), nombre=trim(p_nombre),
    identificacion=nullif(trim(p_identificacion),''), contacto_nombre=nullif(trim(p_contacto_nombre),''),
    telefono=nullif(trim(p_telefono),''), correo=lower(nullif(trim(p_correo),'')),
    direccion=nullif(trim(p_direccion),''), dias_credito=coalesce(p_dias_credito,0),
    limite_credito=round(coalesce(p_limite_credito,0),2), notas=nullif(trim(p_notas),'')
  where id=v_proveedor.id;
end;
$$;

create or replace function public.avicola_cambiar_estado_proveedor(
  p_proveedor_id uuid,
  p_activo boolean
)
returns void
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_proveedor public.proveedores_avicola%rowtype;
begin
  select * into v_proveedor from public.proveedores_avicola
  where id=p_proveedor_id and deleted_at is null for update;
  if not found then raise exception 'Proveedor no encontrado.' using errcode='23503'; end if;

  if not exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id=v_proveedor.empresa_id and eu.usuario_id=auth.uid()
      and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','compras')
  ) then raise exception 'No autorizado para cambiar el estado del proveedor.' using errcode='42501'; end if;

  update public.proveedores_avicola set activo=coalesce(p_activo,false)
  where id=v_proveedor.id;
end;
$$;

grant execute on function public.avicola_crear_proveedor(uuid,text,text,text,text,text,text,text,integer,numeric,text) to authenticated;
grant execute on function public.avicola_actualizar_proveedor(uuid,text,text,text,text,text,text,text,integer,numeric,text) to authenticated;
grant execute on function public.avicola_cambiar_estado_proveedor(uuid,boolean) to authenticated;

commit;
