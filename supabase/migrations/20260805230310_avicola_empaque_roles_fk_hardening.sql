begin;

alter table public.empresa_usuarios
  drop constraint if exists empresa_usuarios_rol_check;

alter table public.empresa_usuarios
  add constraint empresa_usuarios_rol_check
  check (rol = any (array[
    'propietario'::text,
    'administrador'::text,
    'supervisor'::text,
    'produccion'::text,
    'empaque'::text,
    'veterinario'::text,
    'inventario'::text,
    'ventas'::text,
    'consulta'::text
  ]));

create unique index if not exists clasificaciones_huevos_id_empresa_uidx
  on public.clasificaciones_huevos(id, empresa_id);

alter table public.empaques_huevos
  drop constraint if exists empaques_granja_empresa_fkey,
  drop constraint if exists empaques_galpon_empresa_fkey,
  drop constraint if exists empaques_lote_empresa_fkey,
  drop constraint if exists empaques_clasificacion_empresa_fkey;

alter table public.empaques_huevos
  add constraint empaques_granja_empresa_fkey
    foreign key (granja_id, empresa_id)
    references public.granjas(id, empresa_id)
    on delete restrict,
  add constraint empaques_galpon_empresa_fkey
    foreign key (galpon_id, empresa_id)
    references public.galpones(id, empresa_id)
    on delete restrict,
  add constraint empaques_lote_empresa_fkey
    foreign key (lote_id, empresa_id)
    references public.lotes(id, empresa_id)
    on delete restrict,
  add constraint empaques_clasificacion_empresa_fkey
    foreign key (clasificacion_id, empresa_id)
    references public.clasificaciones_huevos(id, empresa_id)
    on delete restrict;

create index if not exists empaques_granja_empresa_idx on public.empaques_huevos(granja_id, empresa_id);
create index if not exists empaques_galpon_empresa_idx on public.empaques_huevos(galpon_id, empresa_id);
create index if not exists empaques_lote_empresa_idx on public.empaques_huevos(lote_id, empresa_id);
create index if not exists empaques_clasificacion_empresa_idx on public.empaques_huevos(clasificacion_id, empresa_id);

commit;
