begin;

create or replace function public.avicola_confirmar_venta(p_venta_id uuid)
returns void
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_venta public.ventas_huevos%rowtype;
  v_det public.venta_huevos_detalles%rowtype;
  v_mov record;
  v_pendiente integer;
  v_tomar integer;
  v_subtotal numeric(14,2);
begin
  select * into v_venta
  from public.ventas_huevos
  where id=p_venta_id
  for update;

  if not found then
    raise exception 'Venta no encontrada.' using errcode='23503';
  end if;

  if not exists (
    select 1
    from public.empresa_usuarios eu
    where eu.empresa_id=v_venta.empresa_id
      and eu.usuario_id=auth.uid()
      and eu.activo=true
      and eu.rol in ('propietario','administrador','supervisor','ventas')
  ) then
    raise exception 'No autorizado.' using errcode='42501';
  end if;

  if v_venta.estado <> 'BORRADOR' then
    raise exception 'Solo se pueden confirmar ventas en borrador.' using errcode='23514';
  end if;

  if v_venta.fecha > current_date then
    raise exception 'No se permiten ventas con fecha futura.' using errcode='23514';
  end if;

  if not exists (
    select 1 from public.venta_huevos_detalles d where d.venta_id=v_venta.id
  ) then
    raise exception 'La venta no tiene productos.' using errcode='23514';
  end if;

  select coalesce(sum(subtotal),0)
  into v_subtotal
  from public.venta_huevos_detalles
  where venta_id=v_venta.id;

  if v_venta.descuento > v_subtotal then
    raise exception 'El descuento no puede superar el subtotal.' using errcode='23514';
  end if;

  for v_det in
    select *
    from public.venta_huevos_detalles
    where venta_id=v_venta.id
    order by id
  loop
    v_pendiente := v_det.unidades_totales;

    for v_mov in
      select
        m.id,
        m.clasificacion_id,
        m.presentacion_id,
        m.lote_id,
        m.fecha,
        m.categoria,
        (
          m.unidades - coalesce((
            select sum(abs(s.unidades))
            from public.movimientos_inventario_huevos s
            where s.movimiento_origen_id=m.id
              and s.tipo='SALIDA_VENTA'
              and s.estado='ACTIVO'
          ),0)
        )::integer as disponible
      from public.movimientos_inventario_huevos m
      where m.empresa_id=v_venta.empresa_id
        and m.tipo='ENTRADA_EMPAQUE'
        and m.estado='ACTIVO'
        and m.presentacion_id=v_det.presentacion_id
        and m.categoria=v_det.categoria
      order by m.fecha,m.created_at,m.id
      for update
    loop
      exit when v_pendiente <= 0;
      if v_mov.disponible <= 0 then continue; end if;

      v_tomar := least(v_pendiente,v_mov.disponible);

      insert into public.movimientos_inventario_huevos(
        empresa_id,empaque_id,clasificacion_id,presentacion_id,lote_id,fecha,categoria,
        tipo,cantidad_empaques,unidades,estado,venta_detalle_id,movimiento_origen_id,referencia
      ) values (
        v_venta.empresa_id,null,v_mov.clasificacion_id,v_mov.presentacion_id,v_mov.lote_id,
        v_venta.fecha,v_mov.categoria,'SALIDA_VENTA',0,-v_tomar,'ACTIVO',v_det.id,v_mov.id,
        'Venta #'||v_venta.numero
      );

      v_pendiente := v_pendiente-v_tomar;
    end loop;

    if v_pendiente > 0 then
      raise exception 'Inventario insuficiente para % / presentación solicitada. Faltan % unidades.',
        v_det.categoria,v_pendiente using errcode='23514';
    end if;
  end loop;

  update public.ventas_huevos
  set subtotal=v_subtotal,
      total=v_subtotal-descuento,
      estado='CONFIRMADA',
      confirmada_at=now(),
      updated_at=now()
  where id=v_venta.id;
end;
$$;

commit;
