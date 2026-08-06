-- Endurecimiento de privilegios para Proveedores y valores por defecto futuros.

REVOKE EXECUTE ON FUNCTION public.avicola_crear_proveedor(uuid, text, text, text, text, text, text, text, integer, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.avicola_actualizar_proveedor(uuid, text, text, text, text, text, text, text, integer, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.avicola_cambiar_estado_proveedor(uuid, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.avicola_crear_proveedor(uuid, text, text, text, text, text, text, text, integer, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.avicola_actualizar_proveedor(uuid, text, text, text, text, text, text, text, integer, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.avicola_cambiar_estado_proveedor(uuid, boolean) TO authenticated;

REVOKE SELECT, REFERENCES, TRIGGER ON TABLE public.proveedores_avicola FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, REFERENCES, TRIGGER ON TABLES FROM anon;
