-- AVÍCOLA ERP — endurecimiento del núcleo Fase 3
-- Mantener este archivo sincronizado con la migración Supabase
-- `avicola_phase_3_hardening`.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.avicola_rol_empresa(p_empresa_id uuid)
returns text language sql stable security definer
set search_path = public, private
as $$
  select eu.rol from public.empresa_usuarios eu
  where eu.empresa_id = p_empresa_id
    and eu.usuario_id = (select auth.uid())
    and eu.activo
  limit 1
$$;
revoke all on function private.avicola_rol_empresa(uuid) from public, anon;
grant execute on function private.avicola_rol_empresa(uuid) to authenticated;

create or replace function private.avicola_tiene_rol(p_empresa_id uuid, p_roles text[])
returns boolean language sql stable security definer
set search_path = public, private
as $$
  select coalesce(private.avicola_rol_empresa(p_empresa_id) = any(p_roles), false)
$$;
revoke all on function private.avicola_tiene_rol(uuid, text[]) from public, anon;
grant execute on function private.avicola_tiene_rol(uuid, text[]) to authenticated;

alter table public.empresa_usuarios drop constraint if exists empresa_usuarios_rol_check;
update public.empresa_usuarios set rol = 'produccion' where rol = 'operador';
alter table public.empresa_usuarios add constraint empresa_usuarios_rol_check
check (rol in ('propietario','administrador','supervisor','produccion','veterinario','inventario','ventas','consulta'));

alter table public.empleados add column if not exists empresa_id uuid;
alter table public.proveedores add column if not exists empresa_id uuid;
alter table public.empleados alter column puesto set default 'Operario';
alter table public.empleados alter column color set default '#2E7D32';

alter table public.empleados drop constraint if exists empleados_empresa_id_fkey;
alter table public.proveedores drop constraint if exists proveedores_empresa_id_fkey;
alter table public.empleados add constraint empleados_empresa_id_fkey foreign key (empresa_id) references public.empresas(id) on delete restrict;
alter table public.proveedores add constraint proveedores_empresa_id_fkey foreign key (empresa_id) references public.empresas(id) on delete restrict;

create unique index if not exists empleados_id_empresa_uidx on public.empleados(id, empresa_id);
create unique index if not exists proveedores_id_empresa_uidx on public.proveedores(id, empresa_id);
create unique index if not exists sucursales_id_empresa_uidx on public.sucursales(id, empresa_id);
create unique index if not exists granjas_id_empresa_uidx on public.granjas(id, empresa_id);
create unique index if not exists galpones_id_empresa_uidx on public.galpones(id, empresa_id);
create unique index if not exists razas_id_empresa_uidx on public.razas(id, empresa_id);
create unique index if not exists lotes_id_empresa_uidx on public.lotes(id, empresa_id);

alter table public.granjas drop constraint if exists granjas_sucursal_id_fkey;
alter table public.granjas drop constraint if exists granjas_administrador_id_fkey;
alter table public.galpones drop constraint if exists galpones_granja_id_fkey;
alter table public.galpones drop constraint if exists galpones_encargado_id_fkey;
alter table public.lotes drop constraint if exists lotes_granja_id_fkey;
alter table public.lotes drop constraint if exists lotes_galpon_id_fkey;
alter table public.lotes drop constraint if exists lotes_raza_id_fkey;
alter table public.lotes drop constraint if exists lotes_proveedor_id_fkey;
alter table public.produccion_diaria drop constraint if exists produccion_diaria_granja_id_fkey;
alter table public.produccion_diaria drop constraint if exists produccion_diaria_galpon_id_fkey;
alter table public.produccion_diaria drop constraint if exists produccion_diaria_lote_id_fkey;

alter table public.granjas add constraint granjas_sucursal_empresa_fkey
foreign key (sucursal_id, empresa_id) references public.sucursales(id, empresa_id) on delete restrict;
alter table public.granjas add constraint granjas_administrador_empresa_fkey
foreign key (administrador_id, empresa_id) references public.empleados(id, empresa_id) on delete set null;
alter table public.galpones add constraint galpones_granja_empresa_fkey
foreign key (granja_id, empresa_id) references public.granjas(id, empresa_id) on delete restrict;
alter table public.galpones add constraint galpones_encargado_empresa_fkey
foreign key (encargado_id, empresa_id) references public.empleados(id, empresa_id) on delete set null;
alter table public.lotes add constraint lotes_granja_empresa_fkey
foreign key (granja_id, empresa_id) references public.granjas(id, empresa_id) on delete restrict;
alter table public.lotes add constraint lotes_galpon_empresa_fkey
foreign key (galpon_id, empresa_id) references public.galpones(id, empresa_id) on delete restrict;
alter table public.lotes add constraint lotes_raza_empresa_fkey
foreign key (raza_id, empresa_id) references public.razas(id, empresa_id) on delete restrict;
alter table public.lotes add constraint lotes_proveedor_empresa_fkey
foreign key (proveedor_id, empresa_id) references public.proveedores(id, empresa_id) on delete restrict;
alter table public.produccion_diaria add constraint produccion_granja_empresa_fkey
foreign key (granja_id, empresa_id) references public.granjas(id, empresa_id) on delete restrict;
alter table public.produccion_diaria add constraint produccion_galpon_empresa_fkey
foreign key (galpon_id, empresa_id) references public.galpones(id, empresa_id) on delete restrict;
alter table public.produccion_diaria add constraint produccion_lote_empresa_fkey
foreign key (lote_id, empresa_id) references public.lotes(id, empresa_id) on delete restrict;

alter table public.produccion_diaria rename column gallinas_vivas to aves_vivas_snapshot;

create or replace function private.avicola_set_aves_snapshot()
returns trigger language plpgsql security definer
set search_path = public, private
as $$
begin
  if tg_op = 'INSERT' or new.lote_id is distinct from old.lote_id then
    select l.cantidad_actual into new.aves_vivas_snapshot
    from public.lotes l
    where l.id = new.lote_id and l.empresa_id = new.empresa_id;
    if new.aves_vivas_snapshot is null then
      raise exception 'El lote no pertenece a la empresa indicada';
    end if;
  else
    new.aves_vivas_snapshot := old.aves_vivas_snapshot;
  end if;
  return new;
end;
$$;
revoke all on function private.avicola_set_aves_snapshot() from public, anon, authenticated;

drop trigger if exists produccion_aves_snapshot_trg on public.produccion_diaria;
create trigger produccion_aves_snapshot_trg before insert or update on public.produccion_diaria
for each row execute function private.avicola_set_aves_snapshot();

create or replace function private.avicola_set_updated_at()
returns trigger language plpgsql security invoker
set search_path = public, private
as $$ begin new.updated_at := now(); return new; end; $$;

DO $$
declare t text;
begin
  foreach t in array array['empresas','sucursales','granjas','galpones','razas','lotes','produccion_diaria','empleados','proveedores'] loop
    execute format('drop trigger if exists %I_updated_at_trg on public.%I', t, t);
    execute format('create trigger %I_updated_at_trg before update on public.%I for each row execute function private.avicola_set_updated_at()', t, t);
  end loop;
end $$;

create or replace function private.avicola_auditar_cambio()
returns trigger language plpgsql security definer
set search_path = public, private
as $$
declare v_row jsonb; v_old jsonb; v_id uuid;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_old := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  if v_row ? 'id' and nullif(v_row->>'id','') is not null then v_id := (v_row->>'id')::uuid; end if;
  insert into public.auditoria(usuario_id, usuario, modulo, accion, descripcion, registro_id, datos)
  values ((select auth.uid()), null, tg_table_name, tg_op, 'Cambio automático en AVÍCOLA ERP', v_id,
    jsonb_build_object('empresa_id', v_row->>'empresa_id', 'nuevo', v_row, 'anterior', v_old));
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.avicola_auditar_cambio() from public, anon, authenticated;

DO $$
declare t text;
begin
  foreach t in array array['empresas','sucursales','granjas','galpones','razas','lotes','produccion_diaria','empleados','proveedores'] loop
    execute format('drop trigger if exists %I_auditoria_trg on public.%I', t, t);
    execute format('create trigger %I_auditoria_trg after insert or update or delete on public.%I for each row execute function private.avicola_auditar_cambio()', t, t);
  end loop;
end $$;

create or replace function private.avicola_proteger_ultimo_propietario()
returns trigger language plpgsql security definer
set search_path = public, private
as $$
declare v_count integer;
begin
  if old.rol = 'propietario' and old.activo and
     (tg_op = 'DELETE' or new.rol <> 'propietario' or not new.activo) then
    select count(*) into v_count from public.empresa_usuarios
    where empresa_id = old.empresa_id and rol = 'propietario' and activo
      and usuario_id <> old.usuario_id;
    if v_count = 0 then raise exception 'La empresa debe conservar al menos un propietario activo'; end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.avicola_proteger_ultimo_propietario() from public, anon, authenticated;

drop trigger if exists empresa_usuarios_ultimo_propietario_trg on public.empresa_usuarios;
create trigger empresa_usuarios_ultimo_propietario_trg before update or delete on public.empresa_usuarios
for each row execute function private.avicola_proteger_ultimo_propietario();

create or replace function public.avicola_crear_empresa(
  p_nombre text,
  p_sucursal_nombre text default 'Sucursal Principal',
  p_granja_nombre text default 'Granja Principal'
)
returns jsonb language plpgsql security definer
set search_path = public, private
as $$
declare
  v_user uuid := (select auth.uid());
  v_empresa uuid; v_sucursal uuid; v_granja uuid;
begin
  if v_user is null then raise exception 'Autenticación requerida'; end if;
  if nullif(trim(p_nombre),'') is null then raise exception 'El nombre de la empresa es obligatorio'; end if;
  insert into public.empresas(nombre) values (trim(p_nombre)) returning id into v_empresa;
  insert into public.empresa_usuarios(empresa_id, usuario_id, rol, activo)
  values (v_empresa, v_user, 'propietario', true);
  insert into public.sucursales(empresa_id, codigo, nombre)
  values (v_empresa, 'SUC-001', coalesce(nullif(trim(p_sucursal_nombre),''),'Sucursal Principal'))
  returning id into v_sucursal;
  insert into public.granjas(empresa_id, sucursal_id, codigo, nombre)
  values (v_empresa, v_sucursal, 'GRA-001', coalesce(nullif(trim(p_granja_nombre),''),'Granja Principal'))
  returning id into v_granja;
  return jsonb_build_object('empresa_id',v_empresa,'sucursal_id',v_sucursal,'granja_id',v_granja);
end;
$$;
revoke all on function public.avicola_crear_empresa(text,text,text) from public, anon;
grant execute on function public.avicola_crear_empresa(text,text,text) to authenticated;

DO $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in
    ('empresas','empresa_usuarios','sucursales','granjas','galpones','razas','lotes','produccion_diaria','empleados','proveedores')
  loop execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
end $$;

create policy empresas_select on public.empresas for select to authenticated
using (private.avicola_rol_empresa(id) is not null);
create policy empresas_update on public.empresas for update to authenticated
using (private.avicola_tiene_rol(id,array['propietario','administrador']))
with check (private.avicola_tiene_rol(id,array['propietario','administrador']));

create policy empresa_usuarios_select on public.empresa_usuarios for select to authenticated
using (usuario_id=(select auth.uid()) or private.avicola_tiene_rol(empresa_id,array['propietario','administrador']));
create policy empresa_usuarios_insert on public.empresa_usuarios for insert to authenticated
with check (private.avicola_tiene_rol(empresa_id,array['propietario','administrador']));
create policy empresa_usuarios_update on public.empresa_usuarios for update to authenticated
using (private.avicola_tiene_rol(empresa_id,array['propietario','administrador']))
with check (private.avicola_tiene_rol(empresa_id,array['propietario','administrador']));
create policy empresa_usuarios_delete on public.empresa_usuarios for delete to authenticated
using (private.avicola_tiene_rol(empresa_id,array['propietario','administrador']));

DO $$
declare t text;
begin
  foreach t in array array['sucursales','granjas','galpones','razas','lotes','empleados','proveedores'] loop
    execute format('create policy %I_select on public.%I for select to authenticated using (private.avicola_rol_empresa(empresa_id) is not null)',t,t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (private.avicola_tiene_rol(empresa_id,array[''propietario'',''administrador'',''supervisor'']))',t,t);
    execute format('create policy %I_update on public.%I for update to authenticated using (private.avicola_tiene_rol(empresa_id,array[''propietario'',''administrador'',''supervisor''])) with check (private.avicola_tiene_rol(empresa_id,array[''propietario'',''administrador'',''supervisor'']))',t,t);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (private.avicola_tiene_rol(empresa_id,array[''propietario'',''administrador'']))',t,t);
  end loop;
end $$;

create policy produccion_select on public.produccion_diaria for select to authenticated
using (private.avicola_rol_empresa(empresa_id) is not null);
create policy produccion_insert on public.produccion_diaria for insert to authenticated
with check (private.avicola_tiene_rol(empresa_id,array['propietario','administrador','supervisor','produccion']));
create policy produccion_update on public.produccion_diaria for update to authenticated
using (private.avicola_tiene_rol(empresa_id,array['propietario','administrador','supervisor','produccion']))
with check (private.avicola_tiene_rol(empresa_id,array['propietario','administrador','supervisor','produccion']));
create policy produccion_delete on public.produccion_diaria for delete to authenticated
using (private.avicola_tiene_rol(empresa_id,array['propietario','administrador']));

create index if not exists granjas_administrador_empresa_idx on public.granjas(administrador_id,empresa_id);
create index if not exists galpones_encargado_empresa_idx on public.galpones(encargado_id,empresa_id);
create index if not exists lotes_proveedor_empresa_idx on public.lotes(proveedor_id,empresa_id);
create index if not exists lotes_raza_empresa_idx on public.lotes(raza_id,empresa_id);
create index if not exists produccion_granja_empresa_idx on public.produccion_diaria(granja_id,empresa_id);
create index if not exists produccion_registrado_por_idx on public.produccion_diaria(registrado_por);
create index if not exists empleados_empresa_idx on public.empleados(empresa_id);
create index if not exists proveedores_empresa_idx on public.proveedores(empresa_id);

commit;
