begin;

alter table public.empresa_usuarios
  drop constraint if exists empresa_usuarios_rol_check;

alter table public.empresa_usuarios
  add constraint empresa_usuarios_rol_check check (
    rol = any (array[
      'propietario','administrador','supervisor','produccion','empaque',
      'veterinario','inventario','ventas','cobranzas','consulta'
    ]::text[])
  );

create table private.avicola_numeradores (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('CXC','ABO')),
  fecha date not null,
  ultimo bigint not null check (ultimo > 0),
  primary key (empresa_id, tipo, fecha)
);

create or replace function private.avicola_siguiente_documento(
  p_empresa_id uuid,
  p_tipo text,
  p_fecha date
)
returns text
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_numero bigint;
begin
  if p_tipo not in ('CXC','ABO') then
    raise exception 'Tipo de documento financiero no válido.' using errcode='23514';
  end if;

  insert into private.avicola_numeradores(empresa_id,tipo,fecha,ultimo)
  values(p_empresa_id,p_tipo,p_fecha,1)
  on conflict (empresa_id,tipo,fecha)
  do update set ultimo=private.avicola_numeradores.ultimo+1
  returning ultimo into v_numero;

  return p_tipo || '-' || to_char(p_fecha,'YYYYMMDD') || '-' || lpad(v_numero::text,6,'0');
end;
$$;

create table public.cuentas_por_cobrar (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  numero text not null,
  cliente_id uuid not null,
  venta_id uuid not null,
  cliente_nombre text not null,
  fecha_emision date not null,
  dias_credito integer not null check (dias_credito between 0 and 365),
  fecha_vencimiento date not null,
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE','PARCIAL','SALDADA','ANULADA')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, empresa_id),
  unique (empresa_id, numero),
  foreign key (cliente_id, empresa_id) references public.clientes_comerciales(id, empresa_id) on delete restrict,
  foreign key (venta_id, empresa_id) references public.ventas_huevos(id, empresa_id) on delete restrict,
  check (fecha_vencimiento >= fecha_emision)
);

create unique index cxc_una_por_venta
  on public.cuentas_por_cobrar(venta_id)
  where deleted_at is null;

create index cxc_empresa_vencimiento_idx
  on public.cuentas_por_cobrar(empresa_id,fecha_vencimiento,estado)
  where deleted_at is null;

create table public.movimientos_cxc (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cuenta_id uuid not null,
  numero text not null,
  tipo text not null check (tipo in ('CARGO_VENTA','ABONO','NOTA_CREDITO','NOTA_DEBITO','AJUSTE_CARGO','AJUSTE_ABONO')),
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  referencia text,
  observaciones text,
  usuario_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, empresa_id),
  unique (empresa_id, numero),
  foreign key (cuenta_id, empresa_id) references public.cuentas_por_cobrar(id, empresa_id) on delete restrict
);

create index movimientos_cxc_cuenta_fecha_idx
  on public.movimientos_cxc(cuenta_id,fecha,created_at)
  where deleted_at is null;

create trigger cxc_updated_at_trg
before update on public.cuentas_por_cobrar
for each row execute function private.avicola_set_updated_at();

create trigger movimientos_cxc_updated_at_trg
before update on public.movimientos_cxc
for each row execute function private.avicola_set_updated_at();

create trigger cxc_auditoria_trg
after insert or update or delete on public.cuentas_por_cobrar
for each row execute function public.fn_auditoria();

create trigger movimientos_cxc_auditoria_trg
after insert or update or delete on public.movimientos_cxc
for each row execute function public.fn_auditoria();

alter table public.cuentas_por_cobrar enable row level security;
alter table public.movimientos_cxc enable row level security;

create policy cxc_select on public.cuentas_por_cobrar
for select to authenticated
using (exists(
  select 1 from public.empresa_usuarios eu
  where eu.empresa_id=cuentas_por_cobrar.empresa_id
    and eu.usuario_id=auth.uid()
    and eu.activo=true
));

create policy movimientos_cxc_select on public.movimientos_cxc
for select to authenticated
using (exists(
  select 1 from public.empresa_usuarios eu
  where eu.empresa_id=movimientos_cxc.empresa_id
    and eu.usuario_id=auth.uid()
    and eu.activo=true
));

grant select on public.cuentas_por_cobrar,public.movimientos_cxc to authenticated;
revoke insert,update,delete on public.cuentas_por_cobrar,public.movimientos_cxc from authenticated;

create or replace view public.cuentas_por_cobrar_saldos
with (security_invoker=true)
as
select
  c.id,
  c.empresa_id,
  c.numero,
  c.cliente_id,
  c.venta_id,
  c.cliente_nombre,
  c.fecha_emision,
  c.dias_credito,
  c.fecha_vencimiento,
  c.estado as estado_registrado,
  coalesce(sum(case when m.tipo in ('CARGO_VENTA','NOTA_DEBITO','AJUSTE_CARGO') then m.monto else 0 end),0)::numeric(14,2) as cargos,
  coalesce(sum(case when m.tipo in ('ABONO','NOTA_CREDITO','AJUSTE_ABONO') then m.monto else 0 end),0)::numeric(14,2) as creditos,
  (coalesce(sum(case when m.tipo in ('CARGO_VENTA','NOTA_DEBITO','AJUSTE_CARGO') then m.monto else 0 end),0)
   - coalesce(sum(case when m.tipo in ('ABONO','NOTA_CREDITO','AJUSTE_ABONO') then m.monto else 0 end),0))::numeric(14,2) as saldo,
  greatest(current_date-c.fecha_vencimiento,0) as dias_vencidos,
  case
    when c.estado='ANULADA' then 'ANULADA'
    when (coalesce(sum(case when m.tipo in ('CARGO_VENTA','NOTA_DEBITO','AJUSTE_CARGO') then m.monto else 0 end),0)
      - coalesce(sum(case when m.tipo in ('ABONO','NOTA_CREDITO','AJUSTE_ABONO') then m.monto else 0 end),0)) <= 0 then 'SALDADA'
    when c.fecha_vencimiento < current_date then 'VENCIDA'
    when coalesce(sum(case when m.tipo in ('ABONO','NOTA_CREDITO','AJUSTE_ABONO') then m.monto else 0 end),0) > 0 then 'PARCIAL'
    else 'PENDIENTE'
  end as estado_operativo,
  c.created_at,
  c.updated_at
from public.cuentas_por_cobrar c
left join public.movimientos_cxc m
  on m.cuenta_id=c.id
 and m.empresa_id=c.empresa_id
 and m.deleted_at is null
where c.deleted_at is null
group by c.id;

grant select on public.cuentas_por_cobrar_saldos to authenticated;

create or replace function public.avicola_registrar_abono(
  p_cuenta_id uuid,
  p_monto numeric,
  p_fecha date default current_date,
  p_referencia text default null,
  p_observaciones text default null
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_cuenta public.cuentas_por_cobrar%rowtype;
  v_saldo numeric(14,2);
  v_movimiento_id uuid;
  v_numero text;
  v_nuevo_saldo numeric(14,2);
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto del abono debe ser mayor que cero.' using errcode='23514';
  end if;
  if p_fecha is null or p_fecha > current_date then
    raise exception 'La fecha del abono no puede ser futura.' using errcode='23514';
  end if;

  select * into v_cuenta
  from public.cuentas_por_cobrar
  where id=p_cuenta_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Cuenta por cobrar no encontrada.' using errcode='23503';
  end if;

  if not exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id=v_cuenta.empresa_id
      and eu.usuario_id=auth.uid()
      and eu.activo=true
      and eu.rol in ('propietario','administrador','supervisor','cobranzas')
  ) then
    raise exception 'No autorizado para registrar abonos.' using errcode='42501';
  end if;

  if v_cuenta.estado in ('SALDADA','ANULADA') then
    raise exception 'La cuenta no admite nuevos abonos.' using errcode='23514';
  end if;

  select coalesce(sum(case when tipo in ('CARGO_VENTA','NOTA_DEBITO','AJUSTE_CARGO') then monto else -monto end),0)
  into v_saldo
  from public.movimientos_cxc
  where cuenta_id=v_cuenta.id and empresa_id=v_cuenta.empresa_id and deleted_at is null;

  if p_monto > v_saldo then
    raise exception 'El abono no puede superar el saldo pendiente de %.',v_saldo using errcode='23514';
  end if;

  v_numero := private.avicola_siguiente_documento(v_cuenta.empresa_id,'ABO',p_fecha);

  insert into public.movimientos_cxc(
    empresa_id,cuenta_id,numero,tipo,monto,fecha,referencia,observaciones,usuario_id
  ) values (
    v_cuenta.empresa_id,v_cuenta.id,v_numero,'ABONO',round(p_monto,2),p_fecha,
    nullif(trim(p_referencia),''),nullif(trim(p_observaciones),''),auth.uid()
  ) returning id into v_movimiento_id;

  v_nuevo_saldo := v_saldo-round(p_monto,2);
  update public.cuentas_por_cobrar
  set estado=case when v_nuevo_saldo=0 then 'SALDADA' else 'PARCIAL' end
  where id=v_cuenta.id;

  return v_movimiento_id;
end;
$$;

grant execute on function public.avicola_registrar_abono(uuid,numeric,date,text,text) to authenticated;
revoke all on function private.avicola_siguiente_documento(uuid,text,date) from public,anon,authenticated;

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
  v_cliente public.clientes_comerciales%rowtype;
  v_pendiente integer;
  v_tomar integer;
  v_subtotal numeric(14,2);
  v_total numeric(14,2);
  v_cuenta_id uuid;
  v_cxc_numero text;
begin
  select * into v_venta from public.ventas_huevos where id=p_venta_id for update;
  if not found then raise exception 'Venta no encontrada.' using errcode='23503'; end if;

  if not exists (
    select 1 from public.empresa_usuarios eu
    where eu.empresa_id=v_venta.empresa_id and eu.usuario_id=auth.uid()
      and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','ventas')
  ) then raise exception 'No autorizado.' using errcode='42501'; end if;

  if v_venta.estado <> 'BORRADOR' then raise exception 'Solo se pueden confirmar ventas en borrador.' using errcode='23514'; end if;
  if v_venta.fecha > current_date then raise exception 'No se permiten ventas con fecha futura.' using errcode='23514'; end if;
  if not exists (select 1 from public.venta_huevos_detalles d where d.venta_id=v_venta.id) then
    raise exception 'La venta no tiene productos.' using errcode='23514';
  end if;

  select coalesce(sum(subtotal),0) into v_subtotal
  from public.venta_huevos_detalles where venta_id=v_venta.id;

  if v_venta.descuento > v_subtotal then
    raise exception 'El descuento no puede superar el subtotal.' using errcode='23514';
  end if;
  v_total := v_subtotal-v_venta.descuento;

  if v_venta.tipo_venta='CREDITO' then
    if v_venta.cliente_id is null then
      raise exception 'Para confirmar una venta a crédito debes seleccionar un cliente registrado.' using errcode='23514';
    end if;
    select * into v_cliente from public.clientes_comerciales
    where id=v_venta.cliente_id and empresa_id=v_venta.empresa_id and activo=true and deleted_at is null;
    if not found then
      raise exception 'El cliente registrado no existe o no está activo.' using errcode='23503';
    end if;
  end if;

  for v_det in select * from public.venta_huevos_detalles where venta_id=v_venta.id order by id loop
    v_pendiente := v_det.unidades_totales;
    for v_mov in
      select m.id,m.clasificacion_id,m.presentacion_id,m.lote_id,m.fecha,m.categoria,
        (m.unidades-coalesce((select sum(abs(s.unidades)) from public.movimientos_inventario_huevos s
          where s.movimiento_origen_id=m.id and s.tipo='SALIDA_VENTA' and s.estado='ACTIVO'),0))::integer disponible
      from public.movimientos_inventario_huevos m
      where m.empresa_id=v_venta.empresa_id and m.tipo='ENTRADA_EMPAQUE' and m.estado='ACTIVO'
        and m.presentacion_id=v_det.presentacion_id and m.categoria=v_det.categoria
      order by m.fecha,m.created_at,m.id for update
    loop
      exit when v_pendiente<=0;
      if v_mov.disponible<=0 then continue; end if;
      v_tomar:=least(v_pendiente,v_mov.disponible);
      insert into public.movimientos_inventario_huevos(
        empresa_id,empaque_id,clasificacion_id,presentacion_id,lote_id,fecha,categoria,
        tipo,cantidad_empaques,unidades,estado,venta_detalle_id,movimiento_origen_id,referencia
      ) values (
        v_venta.empresa_id,null,v_mov.clasificacion_id,v_mov.presentacion_id,v_mov.lote_id,
        v_venta.fecha,v_mov.categoria,'SALIDA_VENTA',0,-v_tomar,'ACTIVO',v_det.id,v_mov.id,'Venta #'||v_venta.numero
      );
      v_pendiente:=v_pendiente-v_tomar;
    end loop;
    if v_pendiente>0 then
      raise exception 'Inventario insuficiente para % / presentación solicitada. Faltan % unidades.',v_det.categoria,v_pendiente using errcode='23514';
    end if;
  end loop;

  if v_venta.tipo_venta='CREDITO' and v_total>0 then
    v_cxc_numero:=private.avicola_siguiente_documento(v_venta.empresa_id,'CXC',v_venta.fecha);
    insert into public.cuentas_por_cobrar(
      empresa_id,numero,cliente_id,venta_id,cliente_nombre,fecha_emision,dias_credito,fecha_vencimiento,estado,created_by
    ) values (
      v_venta.empresa_id,v_cxc_numero,v_cliente.id,v_venta.id,v_cliente.nombre,v_venta.fecha,
      v_cliente.dias_credito,v_venta.fecha+v_cliente.dias_credito,'PENDIENTE',auth.uid()
    ) returning id into v_cuenta_id;

    insert into public.movimientos_cxc(
      empresa_id,cuenta_id,numero,tipo,monto,fecha,referencia,observaciones,usuario_id
    ) values (
      v_venta.empresa_id,v_cuenta_id,v_cxc_numero,'CARGO_VENTA',v_total,v_venta.fecha,
      'Venta #'||v_venta.numero,'Cargo automático por venta a crédito',auth.uid()
    );
  end if;

  update public.ventas_huevos
  set subtotal=v_subtotal,total=v_total,estado='CONFIRMADA',confirmada_at=now(),updated_at=now()
  where id=v_venta.id;
end;
$$;

grant execute on function public.avicola_confirmar_venta(uuid) to authenticated;

commit;