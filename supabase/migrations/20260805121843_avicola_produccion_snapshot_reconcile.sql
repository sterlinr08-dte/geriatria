begin;

drop trigger if exists produccion_aves_snapshot_trg on public.produccion_diaria;
drop function if exists private.avicola_set_aves_snapshot();

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

  if tg_op = 'INSERT'
     or new.lote_id is distinct from old.lote_id
     or new.empresa_id is distinct from old.empresa_id then
    new.aves_vivas_snapshot := v_lote.cantidad_actual;
  else
    new.aves_vivas_snapshot := old.aves_vivas_snapshot;
  end if;

  new.registrado_por := coalesce(new.registrado_por, auth.uid());

  if new.fecha > current_date then
    raise exception 'No se puede registrar producción en una fecha futura.' using errcode = '23514';
  end if;

  return new;
end;
$$;

commit;
