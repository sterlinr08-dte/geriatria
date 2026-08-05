begin;

alter table public.clasificaciones_huevos drop constraint if exists clasificacion_produccion_unique;
drop index if exists public.clasificacion_produccion_unique;
create unique index if not exists clasificacion_produccion_activa_unique
  on public.clasificaciones_huevos(produccion_id)
  where deleted_at is null and estado = 'CONFIRMADA';

create or replace view public.clasificaciones_huevos_activas
with (security_invoker = true)
as
select * from public.clasificaciones_huevos
where deleted_at is null and estado = 'CONFIRMADA';
grant select on public.clasificaciones_huevos_activas to authenticated;

create table if not exists public.presentaciones_huevos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
  nombre text not null, unidades_por_empaque integer not null check (unidades_por_empaque > 0),
  tipo text not null default 'OTRO' check (tipo in ('DOCENA','BANDEJA','CAJA','OTRO')), activo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint presentaciones_huevos_empresa_id_id_unique unique (empresa_id,id),
  constraint presentaciones_huevos_nombre_unique unique (empresa_id,nombre)
);
insert into public.presentaciones_huevos(empresa_id,nombre,unidades_por_empaque,tipo)
select e.id,x.nombre,x.unidades,x.tipo from public.empresas e
cross join (values ('Docena',12,'DOCENA'),('Bandeja de 30',30,'BANDEJA'),('Caja de 180',180,'CAJA'),('Caja de 360',360,'CAJA')) x(nombre,unidades,tipo)
on conflict (empresa_id,nombre) do nothing;

create table if not exists public.empaques_huevos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
  clasificacion_id uuid not null references public.clasificaciones_huevos(id) on delete restrict, presentacion_id uuid not null,
  granja_id uuid not null, galpon_id uuid not null, lote_id uuid not null, fecha date not null default current_date,
  categoria text not null check (categoria in ('JUMBO','EXTRA_GRANDE','GRANDE','MEDIANO','PEQUENO','INDUSTRIAL')),
  cantidad_empaques integer not null check (cantidad_empaques > 0), unidades_por_empaque integer not null check (unidades_por_empaque > 0),
  unidades_totales integer not null check (unidades_totales > 0), operario_id uuid, observaciones text,
  estado text not null default 'CONFIRMADO' check (estado in ('BORRADOR','CONFIRMADO','ANULADO')),
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint empaques_presentacion_empresa_fkey foreign key (empresa_id,presentacion_id) references public.presentaciones_huevos(empresa_id,id) on delete restrict,
  constraint empaques_operario_empresa_fkey foreign key (empresa_id,operario_id) references public.empleados(empresa_id,id) on delete restrict
);
create index if not exists empaques_empresa_fecha_idx on public.empaques_huevos(empresa_id,fecha desc) where deleted_at is null;
create index if not exists empaques_clasificacion_categoria_idx on public.empaques_huevos(clasificacion_id,categoria) where deleted_at is null and estado <> 'ANULADO';

create table if not exists public.movimientos_inventario_huevos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references public.empresas(id) on delete cascade,
  empaque_id uuid not null unique references public.empaques_huevos(id) on delete restrict,
  clasificacion_id uuid not null references public.clasificaciones_huevos(id) on delete restrict, presentacion_id uuid not null,
  lote_id uuid not null, fecha date not null, categoria text not null,
  tipo text not null default 'ENTRADA_EMPAQUE' check (tipo in ('ENTRADA_EMPAQUE')),
  cantidad_empaques integer not null, unidades integer not null,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO','ANULADO')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint movimientos_presentacion_empresa_fkey foreign key (empresa_id,presentacion_id) references public.presentaciones_huevos(empresa_id,id) on delete restrict
);
create index if not exists movimientos_huevos_empresa_fecha_idx on public.movimientos_inventario_huevos(empresa_id,fecha desc);

create or replace function private.avicola_preparar_empaque() returns trigger language plpgsql security definer
set search_path = public, private, pg_temp as $$
declare v_clas public.clasificaciones_huevos%rowtype; v_presentacion public.presentaciones_huevos%rowtype; v_disponible integer; v_ya_empaquetado bigint;
begin
  select * into v_clas from public.clasificaciones_huevos where id=new.clasificacion_id and empresa_id=new.empresa_id and deleted_at is null and estado='CONFIRMADA' for update;
  if not found then raise exception 'La clasificación no existe, está anulada o no pertenece a la empresa.' using errcode='23503'; end if;
  select * into v_presentacion from public.presentaciones_huevos where id=new.presentacion_id and empresa_id=new.empresa_id and activo=true and deleted_at is null;
  if not found then raise exception 'La presentación no existe, está inactiva o no pertenece a la empresa.' using errcode='23503'; end if;
  v_disponible := case new.categoria when 'JUMBO' then v_clas.jumbo when 'EXTRA_GRANDE' then v_clas.extra_grande when 'GRANDE' then v_clas.grande when 'MEDIANO' then v_clas.mediano when 'PEQUENO' then v_clas.pequeno when 'INDUSTRIAL' then v_clas.industrial else 0 end;
  new.unidades_por_empaque:=v_presentacion.unidades_por_empaque; new.unidades_totales:=new.cantidad_empaques*v_presentacion.unidades_por_empaque;
  select coalesce(sum(e.unidades_totales),0) into v_ya_empaquetado from public.empaques_huevos e
   where e.clasificacion_id=new.clasificacion_id and e.categoria=new.categoria and e.deleted_at is null and e.estado='CONFIRMADO' and e.id is distinct from new.id;
  if new.estado='CONFIRMADO' and new.deleted_at is null and v_ya_empaquetado+new.unidades_totales>v_disponible then
    raise exception 'No hay huevos suficientes en la categoría %. Disponibles: %, ya empacados: %, solicitados: %.',new.categoria,v_disponible,v_ya_empaquetado,new.unidades_totales using errcode='23514';
  end if;
  new.granja_id:=v_clas.granja_id; new.galpon_id:=v_clas.galpon_id; new.lote_id:=v_clas.lote_id; new.fecha:=coalesce(new.fecha,current_date);
  if new.fecha>current_date then raise exception 'No se puede registrar un empaque en una fecha futura.' using errcode='23514'; end if;
  new.registrado_por:=coalesce(new.registrado_por,auth.uid()); return new;
end; $$;

create or replace function private.avicola_sincronizar_movimiento_empaque() returns trigger language plpgsql security definer
set search_path = public, private, pg_temp as $$
begin
 insert into public.movimientos_inventario_huevos(empresa_id,empaque_id,clasificacion_id,presentacion_id,lote_id,fecha,categoria,cantidad_empaques,unidades,estado)
 values(new.empresa_id,new.id,new.clasificacion_id,new.presentacion_id,new.lote_id,new.fecha,new.categoria,new.cantidad_empaques,new.unidades_totales,
 case when new.deleted_at is null and new.estado='CONFIRMADO' then 'ACTIVO' else 'ANULADO' end)
 on conflict(empaque_id) do update set empresa_id=excluded.empresa_id,clasificacion_id=excluded.clasificacion_id,presentacion_id=excluded.presentacion_id,
 lote_id=excluded.lote_id,fecha=excluded.fecha,categoria=excluded.categoria,cantidad_empaques=excluded.cantidad_empaques,unidades=excluded.unidades,estado=excluded.estado,updated_at=now();
 return new;
end; $$;

drop trigger if exists empaques_preparar_trg on public.empaques_huevos;
create trigger empaques_preparar_trg before insert or update of empresa_id,clasificacion_id,presentacion_id,categoria,cantidad_empaques,fecha,estado,deleted_at on public.empaques_huevos for each row execute function private.avicola_preparar_empaque();
drop trigger if exists empaques_movimiento_trg on public.empaques_huevos;
create trigger empaques_movimiento_trg after insert or update of empresa_id,clasificacion_id,presentacion_id,categoria,cantidad_empaques,fecha,estado,deleted_at on public.empaques_huevos for each row execute function private.avicola_sincronizar_movimiento_empaque();
drop trigger if exists empaques_updated_at_trg on public.empaques_huevos;
create trigger empaques_updated_at_trg before update on public.empaques_huevos for each row execute function private.avicola_set_updated_at();
drop trigger if exists empaques_auditoria_trg on public.empaques_huevos;
create trigger empaques_auditoria_trg after insert or update or delete on public.empaques_huevos for each row execute function private.avicola_auditar_cambio();
drop trigger if exists presentaciones_updated_at_trg on public.presentaciones_huevos;
create trigger presentaciones_updated_at_trg before update on public.presentaciones_huevos for each row execute function private.avicola_set_updated_at();

alter table public.presentaciones_huevos enable row level security; alter table public.empaques_huevos enable row level security; alter table public.movimientos_inventario_huevos enable row level security;
create policy presentaciones_select on public.presentaciones_huevos for select to authenticated using (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=presentaciones_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true));
create policy presentaciones_write on public.presentaciones_huevos for all to authenticated using (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=presentaciones_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true and eu.rol in ('propietario','administrador','supervisor'))) with check (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=presentaciones_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true and eu.rol in ('propietario','administrador','supervisor')));
create policy empaques_select on public.empaques_huevos for select to authenticated using (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=empaques_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true));
create policy empaques_insert on public.empaques_huevos for insert to authenticated with check (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=empaques_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','produccion','empaque')));
create policy empaques_update on public.empaques_huevos for update to authenticated using (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=empaques_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','produccion','empaque'))) with check (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=empaques_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true and eu.rol in ('propietario','administrador','supervisor','produccion','empaque')));
create policy movimientos_select on public.movimientos_inventario_huevos for select to authenticated using (exists(select 1 from public.empresa_usuarios eu where eu.empresa_id=movimientos_inventario_huevos.empresa_id and eu.usuario_id=auth.uid() and eu.activo=true));
revoke insert,update,delete on public.movimientos_inventario_huevos from authenticated;
grant select,insert,update on public.presentaciones_huevos to authenticated; grant select,insert,update on public.empaques_huevos to authenticated; grant select on public.movimientos_inventario_huevos to authenticated;
revoke all on function private.avicola_preparar_empaque() from public,anon; revoke all on function private.avicola_sincronizar_movimiento_empaque() from public,anon;
grant execute on function private.avicola_preparar_empaque() to authenticated,service_role; grant execute on function private.avicola_sincronizar_movimiento_empaque() to authenticated,service_role;
commit;