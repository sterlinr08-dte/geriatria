begin;

-- Reconciliar el esquema vivo con Git y dejar una definición canónica.
alter table public.galpones drop constraint if exists galpones_granja_empresa_fkey;
alter table public.galpones add constraint galpones_granja_empresa_fkey
  foreign key (granja_id, empresa_id)
  references public.granjas(id, empresa_id)
  on delete restrict;

alter table public.galpones drop constraint if exists galpones_encargado_empresa_fkey;
alter table public.galpones add constraint galpones_encargado_empresa_fkey
  foreign key (encargado_id, empresa_id)
  references public.empleados(id, empresa_id)
  on delete set null;

-- Retirar triggers heredados duplicados. Se conservan los triggers AVÍCOLA.
drop trigger if exists trg_auditoria on public.empleados;
drop trigger if exists trg_empleados_updated on public.empleados;
drop trigger if exists trg_auditoria on public.proveedores;
drop trigger if exists trg_proveedores_updated on public.proveedores;

-- Reafirmar que existe exactamente un trigger AVÍCOLA por responsabilidad.
drop trigger if exists empleados_updated_at_trg on public.empleados;
create trigger empleados_updated_at_trg
before update on public.empleados
for each row execute function private.avicola_set_updated_at();

drop trigger if exists empleados_auditoria_trg on public.empleados;
create trigger empleados_auditoria_trg
after insert or update or delete on public.empleados
for each row execute function private.avicola_auditar_cambio();

drop trigger if exists proveedores_updated_at_trg on public.proveedores;
create trigger proveedores_updated_at_trg
before update on public.proveedores
for each row execute function private.avicola_set_updated_at();

drop trigger if exists proveedores_auditoria_trg on public.proveedores;
create trigger proveedores_auditoria_trg
after insert or update or delete on public.proveedores
for each row execute function private.avicola_auditar_cambio();

commit;
