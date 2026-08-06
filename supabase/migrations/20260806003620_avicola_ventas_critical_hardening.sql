begin;

-- 1) Restaurar Empaque tras convertir el UNIQUE absoluto en índice parcial.
-- PostgreSQL no permite ON CONFLICT (empaque_id) sobre un índice parcial sin predicado,
-- por lo que sincronizamos con UPDATE + INSERT de forma explícita.
create or replace function private.avicola_sincronizar_movimiento_empaque()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado text;
begin
  v_estado := case
    when new.deleted_at is null and new.estado = 'CONFIRMADO' then 'ACTIVO'
    else 'ANULADO'
  end;

  update public.movimientos_inventario_huevos
     set empresa_id = new.empresa_id,
         clasificacion_id = new.clasificacion_id,
         presentacion_id = new.presentacion_id,
         lote_id = new.lote_id,
         fecha = new.fecha,
         categoria = new.categoria,
         cantidad_empaques = new.cantidad_empaques,
         unidades = new.unidades_totales,
         estado = v_estado,
         updated_at = now()
   where empaque_id = new.id
     and tipo = 'ENTRADA_EMPAQUE';

  if not found then
    insert into public.movimientos_inventario_huevos(
      empresa_id, empaque_id, clasificacion_id, presentacion_id, lote_id,
      fecha, categoria, tipo, cantidad_empaques, unidades, estado
    ) values (
      new.empresa_id, new.id, new.clasificacion_id, new.presentacion_id, new.lote_id,
      new.fecha, new.categoria, 'ENTRADA_EMPAQUE', new.cantidad_empaques,
      new.unidades_totales, v_estado
    );
  end if;

  return new;
end;
$$;

-- 2) Una venta solo puede permanecer BORRADOR mediante UPDATE directo.
-- La transición a CONFIRMADA queda reservada a avicola_confirmar_venta().
drop policy if exists ventas_update on public.ventas_huevos;
create policy ventas_update
on public.ventas_huevos
for update
to authenticated
using (
  estado = 'BORRADOR'
  and exists (
    select 1
    from public.empresa_usuarios eu
    where eu.empresa_id = ventas_huevos.empresa_id
      and eu.usuario_id = auth.uid()
      and eu.activo = true
      and eu.rol in ('propietario','administrador','supervisor','ventas')
  )
)
with check (
  estado = 'BORRADOR'
  and confirmada_at is null
  and exists (
    select 1
    from public.empresa_usuarios eu
    where eu.empresa_id = ventas_huevos.empresa_id
      and eu.usuario_id = auth.uid()
      and eu.activo = true
      and eu.rol in ('propietario','administrador','supervisor','ventas')
  )
);

-- 3) Auditoría y updated_at automáticos para las tablas comerciales.
alter table public.venta_huevos_detalles
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

drop trigger if exists clientes_comerciales_updated_at_trg on public.clientes_comerciales;
create trigger clientes_comerciales_updated_at_trg
before update on public.clientes_comerciales
for each row execute function private.avicola_set_updated_at();

drop trigger if exists ventas_huevos_updated_at_trg on public.ventas_huevos;
create trigger ventas_huevos_updated_at_trg
before update on public.ventas_huevos
for each row execute function private.avicola_set_updated_at();

drop trigger if exists venta_huevos_detalles_updated_at_trg on public.venta_huevos_detalles;
create trigger venta_huevos_detalles_updated_at_trg
before update on public.venta_huevos_detalles
for each row execute function private.avicola_set_updated_at();

drop trigger if exists clientes_comerciales_auditoria_trg on public.clientes_comerciales;
create trigger clientes_comerciales_auditoria_trg
after insert or update or delete on public.clientes_comerciales
for each row execute function private.avicola_auditar_cambio();

drop trigger if exists ventas_huevos_auditoria_trg on public.ventas_huevos;
create trigger ventas_huevos_auditoria_trg
after insert or update or delete on public.ventas_huevos
for each row execute function private.avicola_auditar_cambio();

drop trigger if exists venta_huevos_detalles_auditoria_trg on public.venta_huevos_detalles;
create trigger venta_huevos_detalles_auditoria_trg
after insert or update or delete on public.venta_huevos_detalles
for each row execute function private.avicola_auditar_cambio();

-- 4) Defensa multiempresa para el encadenamiento FEFO entre movimientos.
create unique index if not exists movimientos_inventario_id_empresa_uidx
  on public.movimientos_inventario_huevos(id, empresa_id);

alter table public.movimientos_inventario_huevos
  drop constraint if exists movimientos_origen_fkey,
  add constraint movimientos_origen_empresa_fkey
    foreign key (movimiento_origen_id, empresa_id)
    references public.movimientos_inventario_huevos(id, empresa_id)
    on delete restrict;

create index if not exists movimientos_origen_empresa_idx
  on public.movimientos_inventario_huevos(movimiento_origen_id, empresa_id)
  where movimiento_origen_id is not null;

commit;
