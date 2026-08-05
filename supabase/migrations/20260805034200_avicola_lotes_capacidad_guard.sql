begin;

create or replace function private.avicola_validar_capacidad_lote()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_capacidad integer;
  v_estado text;
  v_ocupacion bigint;
begin
  if new.galpon_id is null or new.deleted_at is not null or new.estado in ('DESCARTADO','CERRADO') then
    return new;
  end if;

  select capacidad, estado
    into v_capacidad, v_estado
  from public.galpones
  where id = new.galpon_id
    and empresa_id = new.empresa_id
    and granja_id = new.granja_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Galpón no disponible o no pertenece a la empresa y granja indicadas.' using errcode = '23503';
  end if;

  if v_estado not in ('ACTIVO','VACIO') then
    raise exception 'Galpón no disponible para recibir lotes.' using errcode = '23514';
  end if;

  select coalesce(sum(cantidad_actual), 0)
    into v_ocupacion
  from public.lotes
  where galpon_id = new.galpon_id
    and empresa_id = new.empresa_id
    and deleted_at is null
    and estado not in ('DESCARTADO','CERRADO')
    and id is distinct from new.id;

  if v_ocupacion + new.cantidad_actual > v_capacidad then
    raise exception 'La capacidad del galpón es %, ocupación actual % y el lote intenta agregar % aves.',
      v_capacidad, v_ocupacion, new.cantidad_actual
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.avicola_validar_capacidad_lote() from public, anon;
grant execute on function private.avicola_validar_capacidad_lote() to authenticated, service_role;

drop trigger if exists lotes_validar_capacidad_trg on public.lotes;
create trigger lotes_validar_capacidad_trg
before insert or update of galpon_id, granja_id, empresa_id, cantidad_actual, estado, deleted_at
on public.lotes
for each row execute function private.avicola_validar_capacidad_lote();

commit;
