begin;

-- La vista de saldos no restaba las salidas de venta.
--
-- Causa: agrupaba TODOS los movimientos por `fecha`. Las entradas llevan la fecha
-- del empaque y las salidas la fecha de la venta, así que caían en grupos distintos;
-- el grupo de la salida quedaba en negativo y lo descartaba el `having sum(...) > 0`.
-- Resultado: la pantalla mostraba existencias ya vendidas.
--
-- Corrección: cada ENTRADA_EMPAQUE es un lote de stock, y lo disponible en él es
-- sus unidades menos las salidas que lo referencian por `movimiento_origen_id`.
-- Es exactamente el mismo cálculo que hace avicola_confirmar_venta() para consumir
-- FEFO, así que pantalla y backend quedan sobre la misma fuente de verdad.
--
-- Nota para el futuro: si algún día se implementa REVERSO_VENTA hay que sumarlo
-- aquí y en avicola_confirmar_venta() a la vez, o las dos volverán a divergir.

create or replace view public.inventario_huevos_saldos
with (security_invoker = true)
as
with entradas as (
  select
    m.id,
    m.empresa_id,
    m.presentacion_id,
    m.lote_id,
    m.categoria,
    m.fecha,
    m.unidades,
    coalesce((
      select sum(abs(s.unidades))
      from public.movimientos_inventario_huevos s
      where s.movimiento_origen_id = m.id
        and s.tipo = 'SALIDA_VENTA'
        and s.estado = 'ACTIVO'
    ), 0) as unidades_consumidas
  from public.movimientos_inventario_huevos m
  where m.tipo = 'ENTRADA_EMPAQUE'
    and m.estado = 'ACTIVO'
)
select
  e.empresa_id,
  e.presentacion_id,
  e.lote_id,
  e.categoria,
  e.fecha as fecha_empaque,
  (e.fecha + p.dias_vida_util) as fecha_vencimiento,
  p.nombre as presentacion,
  p.unidades_por_empaque,
  p.dias_vida_util,
  l.codigo as lote_codigo,
  -- Empaques derivados de las unidades que realmente quedan. Se usa floor porque
  -- un empaque parcial no es vendible: si FEFO partió una entrada entre dos ventas,
  -- el sobrante en unidades puede no completar un empaque.
  floor(
    sum(e.unidades - e.unidades_consumidas)::numeric
    / nullif(p.unidades_por_empaque, 0)
  )::bigint as empaques_disponibles,
  sum(e.unidades - e.unidades_consumidas)::bigint as unidades_disponibles,
  greatest(((e.fecha + p.dias_vida_util) - current_date), 0) as dias_restantes,
  case
    when (e.fecha + p.dias_vida_util) < current_date then 'VENCIDO'
    when (e.fecha + p.dias_vida_util) <= current_date + 3 then 'CRITICO'
    when (e.fecha + p.dias_vida_util) <= current_date + 7 then 'PROXIMO'
    else 'VIGENTE'
  end as estado_fefo
from entradas e
join public.presentaciones_huevos p
  on p.id = e.presentacion_id and p.empresa_id = e.empresa_id
join public.lotes l
  on l.id = e.lote_id and l.empresa_id = e.empresa_id
group by e.empresa_id, e.presentacion_id, e.lote_id, e.categoria, e.fecha,
         p.nombre, p.unidades_por_empaque, p.dias_vida_util, l.codigo
having sum(e.unidades - e.unidades_consumidas) > 0;

-- Índice de apoyo para el subselect de salidas por entrada.
create index if not exists movimientos_salida_por_origen_idx
  on public.movimientos_inventario_huevos(movimiento_origen_id)
  where tipo = 'SALIDA_VENTA' and estado = 'ACTIVO';

commit;
