begin;

create table if not exists public.recolecciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  granja_id uuid not null,
  galpon_id uuid not null,
  lote_id uuid not null,
  fecha date not null default current_date,
  numero_recorrido integer not null check (numero_recorrido > 0),
  hora_inicio time not null,
  hora_fin time,
  operario_id uuid,
  sector text,
  cantidad integer not null check (cantidad >= 0),
  observaciones text,
  estado text not null default 'ABIERTO' check (estado in ('ABIERTO','CERRADO','ANULADO')),
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recoleccion_horas_check check (hora_fin is null or hora_fin >= hora_inicio),
  constraint recoleccion_granja_empresa_fkey foreign key (granja_id, empresa_id) references public.granjas(id, empresa_id) on delete restrict,
  constraint recoleccion_galpon_empresa_fkey foreign key (galpon_id, empresa_id) references public.galpones(id, empresa_id) on delete restrict,
  constraint recoleccion_lote_empresa_fkey foreign key (lote_id, empresa_id) references public.lotes(id, empresa_id) on delete restrict,
  constraint recoleccion_operario_empresa_fkey foreign key (operario_id, empresa_id) references public.empleados(id, empresa_id) on delete set null
);

create unique index if not exists recolecciones_lote_fecha_recorrido_uq
  on public.recolecciones(lote_id, fecha, numero_recorrido)
  where deleted_at is null and estado <> 'ANULADO';
create index if not exists recolecciones_empresa_fecha_idx on public.recolecciones(empresa_id, fecha desc);
create index if not exists recolecciones_lote_fecha_idx on public.recolecciones(lote_id, fecha);
create index if not exists recolecciones_galpon_fecha_idx on public.recolecciones(galpon_id, fecha);
create index if not exists recolecciones_operario_idx on public.recolecciones(operario_id) where operario_id is not null;

create or replace function private.avicola_preparar_recoleccion()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_lote public.lotes%rowtype;
begin
  select * into v_lote
  from public.lotes
  where id = new.lote_id and empresa_id = new.empresa_id and deleted_at is null
  for share;

  if not found then
    raise exception 'El lote no existe o no pertenece a la empresa.' using errcode = '23503';
  end if;
  if v_lote.estado in ('DESCARTADO','CERRADO') then
    raise exception 'No se puede registrar recolección para un lote cerrado o descartado.' using errcode = '23514';
  end if;
  if v_lote.galpon_id is null then
    raise exception 'El lote debe tener un galpón asignado.' using errcode = '23514';
  end if;
  if new.fecha > current_date then
    raise exception 'No se puede registrar una recolección futura.' using errcode = '23514';
  end if;

  new.granja_id := v_lote.granja_id;
  new.galpon_id := v_lote.galpon_id;
  new.registrado_por := coalesce(new.registrado_por, auth.uid());
  return new;
end;
$$;

create or replace function private.avicola_consolidar_recoleccion()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_empresa uuid;
  v_lote uuid;
  v_fecha date;
  v_total bigint;
  v_clasificados bigint;
  v_lote_row public.lotes%rowtype;
begin
  v_empresa := coalesce(new.empresa_id, old.empresa_id);
  v_lote := coalesce(new.lote_id, old.lote_id);
  v_fecha := coalesce(new.fecha, old.fecha);

  perform 1 from public.lotes where id = v_lote for update;
  select * into v_lote_row from public.lotes where id = v_lote and empresa_id = v_empresa;

  select coalesce(sum(cantidad),0) into v_total
  from public.recolecciones
  where empresa_id = v_empresa and lote_id = v_lote and fecha = v_fecha
    and deleted_at is null and estado <> 'ANULADO';

  select coalesce(huevos_buenos + huevos_rotos + huevos_sucios + huevos_deformes + huevos_descartados,0)
    into v_clasificados
  from public.produccion_diaria
  where lote_id = v_lote and fecha = v_fecha;

  if coalesce(v_clasificados,0) > v_total then
    raise exception 'La recolección consolidada (%) no puede quedar por debajo de los huevos ya clasificados (%).', v_total, v_clasificados using errcode = '23514';
  end if;

  insert into public.produccion_diaria(
    empresa_id, granja_id, galpon_id, lote_id, fecha, aves_vivas_snapshot,
    huevos_recolectados, huevos_buenos, huevos_rotos, huevos_sucios,
    huevos_deformes, huevos_descartados, observaciones, registrado_por
  ) values (
    v_empresa, v_lote_row.granja_id, v_lote_row.galpon_id, v_lote, v_fecha, v_lote_row.cantidad_actual,
    v_total, 0, 0, 0, 0, 0, 'Consolidado automáticamente desde Recolección', auth.uid()
  )
  on conflict (lote_id, fecha) do update
    set huevos_recolectados = excluded.huevos_recolectados,
        updated_at = now();

  return coalesce(new, old);
end;
$$;

revoke all on function private.avicola_preparar_recoleccion() from public, anon;
revoke all on function private.avicola_consolidar_recoleccion() from public, anon;
grant execute on function private.avicola_preparar_recoleccion() to authenticated, service_role;
grant execute on function private.avicola_consolidar_recoleccion() to authenticated, service_role;

drop trigger if exists recolecciones_preparar_trg on public.recolecciones;
create trigger recolecciones_preparar_trg before insert or update of empresa_id,lote_id,fecha on public.recolecciones
for each row execute function private.avicola_preparar_recoleccion();

drop trigger if exists recolecciones_consolidar_trg on public.recolecciones;
create trigger recolecciones_consolidar_trg after insert or update or delete on public.recolecciones
for each row execute function private.avicola_consolidar_recoleccion();

drop trigger if exists recolecciones_updated_at_trg on public.recolecciones;
create trigger recolecciones_updated_at_trg before update on public.recolecciones
for each row execute function private.avicola_set_updated_at();

drop trigger if exists recolecciones_auditoria_trg on public.recolecciones;
create trigger recolecciones_auditoria_trg after insert or update or delete on public.recolecciones
for each row execute function private.avicola_auditar_cambio();

alter table public.recolecciones enable row level security;

drop policy if exists recolecciones_select on public.recolecciones;
create policy recolecciones_select on public.recolecciones for select to authenticated
using (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = recolecciones.empresa_id and eu.usuario_id = (select auth.uid()) and eu.activo));

drop policy if exists recolecciones_insert on public.recolecciones;
create policy recolecciones_insert on public.recolecciones for insert to authenticated
with check (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = recolecciones.empresa_id and eu.usuario_id = (select auth.uid()) and eu.activo and eu.rol in ('propietario','administrador','supervisor','produccion')));

drop policy if exists recolecciones_update on public.recolecciones;
create policy recolecciones_update on public.recolecciones for update to authenticated
using (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = recolecciones.empresa_id and eu.usuario_id = (select auth.uid()) and eu.activo and eu.rol in ('propietario','administrador','supervisor','produccion')))
with check (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = recolecciones.empresa_id and eu.usuario_id = (select auth.uid()) and eu.activo and eu.rol in ('propietario','administrador','supervisor','produccion')));

drop policy if exists recolecciones_delete on public.recolecciones;
create policy recolecciones_delete on public.recolecciones for delete to authenticated
using (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = recolecciones.empresa_id and eu.usuario_id = (select auth.uid()) and eu.activo and eu.rol in ('propietario','administrador')));

grant select,insert,update,delete on public.recolecciones to authenticated;

commit;
