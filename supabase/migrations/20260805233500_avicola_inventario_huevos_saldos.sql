begin;

alter table public.presentaciones_huevos
  add column if not exists dias_vida_util integer not null default 21
  check (dias_vida_util > 0 and dias_vida_util <= 365);

create or replace view public.inventario_huevos_saldos
with (security_invoker = true)
as
select
  m.empresa_id,
  m.presentacion_id,
  m.lote_id,
  m.categoria,
  m.fecha as fecha_empaque,
  (m.fecha + p.dias_vida_util) as fecha_vencimiento,
  p.nombre as presentacion,
  p.unidades_por_empaque,
  p.dias_vida_util,
  l.codigo as lote_codigo,
  sum(case when m.estado = 'ACTIVO' then m.cantidad_empaques else 0 end)::bigint as empaques_disponibles,
  sum(case when m.estado = 'ACTIVO' then m.unidades else 0 end)::bigint as unidades_disponibles,
  greatest(((m.fecha + p.dias_vida_util) - current_date), 0) as dias_restantes,
  case
    when (m.fecha + p.dias_vida_util) < current_date then 'VENCIDO'
    when (m.fecha + p.dias_vida_util) <= current_date + 3 then 'CRITICO'
    when (m.fecha + p.dias_vida_util) <= current_date + 7 then 'PROXIMO'
    else 'VIGENTE'
  end as estado_fefo
from public.movimientos_inventario_huevos m
join public.presentaciones_huevos p
  on p.id = m.presentacion_id and p.empresa_id = m.empresa_id
join public.lotes l
  on l.id = m.lote_id and l.empresa_id = m.empresa_id
where m.estado = 'ACTIVO'
group by m.empresa_id, m.presentacion_id, m.lote_id, m.categoria, m.fecha,
         p.nombre, p.unidades_por_empaque, p.dias_vida_util, l.codigo
having sum(case when m.estado = 'ACTIVO' then m.unidades else 0 end) > 0;

grant select on public.inventario_huevos_saldos to authenticated;

create index if not exists movimientos_inventario_empresa_fecha_idx
  on public.movimientos_inventario_huevos(empresa_id, fecha, presentacion_id, categoria)
  where estado = 'ACTIVO';

commit;
