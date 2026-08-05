begin;

create or replace function private.avicola_recalcular_produccion_recoleccion(p_empresa uuid, p_lote uuid, p_fecha date)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_total bigint;
  v_clasificados bigint;
  v_lote_row public.lotes%rowtype;
begin
  perform 1 from public.lotes where id = p_lote for update;
  select * into v_lote_row from public.lotes where id = p_lote and empresa_id = p_empresa;
  if not found then return; end if;

  select coalesce(sum(cantidad),0) into v_total
  from public.recolecciones
  where empresa_id = p_empresa and lote_id = p_lote and fecha = p_fecha
    and deleted_at is null and estado <> 'ANULADO';

  select coalesce(huevos_buenos + huevos_rotos + huevos_sucios + huevos_deformes + huevos_descartados,0)
    into v_clasificados
  from public.produccion_diaria
  where lote_id = p_lote and fecha = p_fecha;

  if coalesce(v_clasificados,0) > v_total then
    raise exception 'La recolección consolidada (%) no puede quedar por debajo de los huevos ya clasificados (%).', v_total, v_clasificados using errcode = '23514';
  end if;

  insert into public.produccion_diaria(
    empresa_id, granja_id, galpon_id, lote_id, fecha, aves_vivas_snapshot,
    huevos_recolectados, huevos_buenos, huevos_rotos, huevos_sucios,
    huevos_deformes, huevos_descartados, observaciones, registrado_por
  ) values (
    p_empresa, v_lote_row.granja_id, v_lote_row.galpon_id, p_lote, p_fecha, v_lote_row.cantidad_actual,
    v_total, 0, 0, 0, 0, 0, 'Consolidado automáticamente desde Recolección', auth.uid()
  )
  on conflict (lote_id, fecha) do update
    set huevos_recolectados = excluded.huevos_recolectados,
        updated_at = now();
end;
$$;

create or replace function private.avicola_consolidar_recoleccion()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op in ('UPDATE','DELETE') then
    perform private.avicola_recalcular_produccion_recoleccion(old.empresa_id, old.lote_id, old.fecha);
  end if;
  if tg_op in ('INSERT','UPDATE') and (
    tg_op = 'INSERT' or new.empresa_id is distinct from old.empresa_id
    or new.lote_id is distinct from old.lote_id or new.fecha is distinct from old.fecha
    or new.cantidad is distinct from old.cantidad or new.estado is distinct from old.estado
    or new.deleted_at is distinct from old.deleted_at
  ) then
    perform private.avicola_recalcular_produccion_recoleccion(new.empresa_id, new.lote_id, new.fecha);
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function private.avicola_recalcular_produccion_recoleccion(uuid,uuid,date) from public, anon;
revoke all on function private.avicola_consolidar_recoleccion() from public, anon;
grant execute on function private.avicola_recalcular_produccion_recoleccion(uuid,uuid,date) to authenticated, service_role;
grant execute on function private.avicola_consolidar_recoleccion() to authenticated, service_role;

commit;
