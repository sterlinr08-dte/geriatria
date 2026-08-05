begin;

create table if not exists public.clasificaciones_huevos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  produccion_id uuid not null references public.produccion_diaria(id) on delete restrict,
  granja_id uuid not null,
  galpon_id uuid not null,
  lote_id uuid not null,
  fecha date not null,
  jumbo integer not null default 0 check (jumbo >= 0),
  extra_grande integer not null default 0 check (extra_grande >= 0),
  grande integer not null default 0 check (grande >= 0),
  mediano integer not null default 0 check (mediano >= 0),
  pequeno integer not null default 0 check (pequeno >= 0),
  industrial integer not null default 0 check (industrial >= 0),
  sucios integer not null default 0 check (sucios >= 0),
  rotos integer not null default 0 check (rotos >= 0),
  fisurados integer not null default 0 check (fisurados >= 0),
  observaciones text,
  estado text not null default 'CONFIRMADA' check (estado in ('CONFIRMADA','ANULADA')),
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint clasificacion_produccion_unique unique (produccion_id)
);

create index if not exists clasificaciones_empresa_fecha_idx on public.clasificaciones_huevos(empresa_id, fecha desc) where deleted_at is null;
create index if not exists clasificaciones_lote_fecha_idx on public.clasificaciones_huevos(lote_id, fecha desc) where deleted_at is null;

create or replace function private.avicola_preparar_clasificacion()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_prod public.produccion_diaria%rowtype;
  v_total bigint;
begin
  select * into v_prod
  from public.produccion_diaria
  where id = new.produccion_id and empresa_id = new.empresa_id
  for update;

  if not found then
    raise exception 'La producción no existe o no pertenece a la empresa.' using errcode='23503';
  end if;

  if new.estado = 'CONFIRMADA' and new.deleted_at is null then
    v_total := new.jumbo + new.extra_grande + new.grande + new.mediano + new.pequeno + new.industrial + new.sucios + new.rotos + new.fisurados;
    if v_total <> v_prod.huevos_recolectados then
      raise exception 'La clasificación (%) debe coincidir exactamente con los huevos recolectados (%).', v_total, v_prod.huevos_recolectados using errcode='23514';
    end if;
  end if;

  new.granja_id := v_prod.granja_id;
  new.galpon_id := v_prod.galpon_id;
  new.lote_id := v_prod.lote_id;
  new.fecha := v_prod.fecha;
  new.registrado_por := coalesce(new.registrado_por, auth.uid());
  return new;
end;
$$;

drop trigger if exists clasificaciones_preparar_trg on public.clasificaciones_huevos;
create trigger clasificaciones_preparar_trg
before insert or update of empresa_id, produccion_id, jumbo, extra_grande, grande, mediano, pequeno, industrial, sucios, rotos, fisurados, estado, deleted_at
on public.clasificaciones_huevos
for each row execute function private.avicola_preparar_clasificacion();

drop trigger if exists clasificaciones_updated_at_trg on public.clasificaciones_huevos;
create trigger clasificaciones_updated_at_trg before update on public.clasificaciones_huevos
for each row execute function private.avicola_set_updated_at();

drop trigger if exists clasificaciones_auditoria_trg on public.clasificaciones_huevos;
create trigger clasificaciones_auditoria_trg after insert or update or delete on public.clasificaciones_huevos
for each row execute function private.avicola_auditar_cambio();

alter table public.clasificaciones_huevos enable row level security;

drop policy if exists clasificaciones_select on public.clasificaciones_huevos;
create policy clasificaciones_select on public.clasificaciones_huevos for select to authenticated
using (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = clasificaciones_huevos.empresa_id and eu.usuario_id = auth.uid() and eu.activo = true));

drop policy if exists clasificaciones_insert on public.clasificaciones_huevos;
create policy clasificaciones_insert on public.clasificaciones_huevos for insert to authenticated
with check (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = clasificaciones_huevos.empresa_id and eu.usuario_id = auth.uid() and eu.activo = true and eu.rol in ('propietario','administrador','supervisor','produccion')));

drop policy if exists clasificaciones_update on public.clasificaciones_huevos;
create policy clasificaciones_update on public.clasificaciones_huevos for update to authenticated
using (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = clasificaciones_huevos.empresa_id and eu.usuario_id = auth.uid() and eu.activo = true and eu.rol in ('propietario','administrador','supervisor','produccion')))
with check (exists (select 1 from public.empresa_usuarios eu where eu.empresa_id = clasificaciones_huevos.empresa_id and eu.usuario_id = auth.uid() and eu.activo = true and eu.rol in ('propietario','administrador','supervisor','produccion')));

grant select, insert, update on public.clasificaciones_huevos to authenticated;
revoke all on function private.avicola_preparar_clasificacion() from public, anon;
grant execute on function private.avicola_preparar_clasificacion() to authenticated, service_role;

commit;