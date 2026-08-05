begin;

create or replace function private.avicola_preparar_produccion_diaria()
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
  where id = new.lote_id
    and empresa_id = new.empresa_id
    and deleted_at is null
  for share;

  if not found then
    raise exception 'El lote no existe o no pertenece a la empresa.' using errcode = '23503';
  end if;

  if v_lote.estado in ('DESCARTADO','CERRADO') then
    raise exception 'No se puede registrar producción para un lote cerrado o descartado.' using errcode = '23514';
  end if;

  if v_lote.galpon_id is null then
    raise exception 'El lote debe tener un galpón asignado para registrar producción.' using errcode = '23514';
  end if;

  new.granja_id := v_lote.granja_id;
  new.galpon_id := v_lote.galpon_id;
  new.aves_vivas_snapshot := v_lote.cantidad_actual;
  new.registrado_por := coalesce(new.registrado_por, auth.uid());

  if new.fecha > current_date then
    raise exception 'No se puede registrar producción en una fecha futura.' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.avicola_preparar_produccion_diaria() from public, anon;
grant execute on function private.avicola_preparar_produccion_diaria() to authenticated, service_role;

drop trigger if exists produccion_diaria_preparar_trg on public.produccion_diaria;
create trigger produccion_diaria_preparar_trg
before insert or update of empresa_id, lote_id, fecha
on public.produccion_diaria
for each row execute function private.avicola_preparar_produccion_diaria();

commit;
