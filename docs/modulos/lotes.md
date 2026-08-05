# Ficha de Gobierno Funcional — Lotes

## 1. Objetivo
Controlar el ciclo de vida de cada grupo de gallinas desde su ingreso hasta su descarte, con trazabilidad por empresa, granja, galpón, raza y proveedor.

## 2. Propósito empresarial
- Conocer cuántas aves ingresaron, cuántas permanecen activas y cuál es su costo acumulado.
- Relacionar producción, mortalidad, alimentación, sanidad y rentabilidad con un lote específico.
- Evitar mezclas de información entre galpones, granjas o empresas.
- Preparar indicadores confiables para decisiones de reemplazo, descarte y rentabilidad.

## 3. Alcance
Incluye alta, consulta, filtros, estado, ubicación, raza, proveedor, cantidades, fechas, costo y observaciones. No incluye todavía movimientos de mortalidad, vacunación, alimentación ni producción detallada; esos módulos se integran por relación.

## 4. Roles
- Lectura: todos los miembros activos de la empresa.
- Crear/editar: propietario, administrador y supervisor.
- Registrar producción: producción, supervisor, administrador y propietario.
- Eliminar físicamente: prohibido.
- Cerrar o descartar: propietario o administrador; supervisor solo mediante flujo autorizado.

## 5. Reglas de negocio
1. Todo lote pertenece a una empresa, una granja y, cuando entra en operación, a un galpón de esa misma empresa.
2. El código es único dentro de la empresa.
3. `cantidad_inicial` debe ser mayor que cero.
4. `cantidad_actual` no puede ser negativa ni mayor que `cantidad_inicial` sin una corrección auditada.
5. La fecha de ingreso no puede ser anterior a la fecha de nacimiento.
6. Un lote activo no puede asignarse a un galpón inactivo o en mantenimiento.
7. La cantidad actual no puede exceder la capacidad disponible del galpón sin autorización auditada.
8. Un lote descartado o cerrado no admite nueva producción.
9. El costo total no puede ser negativo.
10. El descarte real no puede ser anterior al ingreso.
11. No se permite cambiar de empresa.
12. Cambiar de granja o galpón con historial requiere un movimiento formal, no una edición simple.

## 6. Flujo operativo
Crear lote → validar granja y galpón → validar capacidad → registrar cantidades y fechas → activar → operar producción/sanidad/alimentación → cerrar o descartar.

## 7. Campos
Obligatorios: código, granja, fecha de ingreso, cantidad inicial, cantidad actual, estado.
Opcionales: galpón, raza, proveedor, fecha de nacimiento, costo total, fecha estimada de descarte, foto, observaciones.
Calculados futuros: edad, semana productiva, mortalidad acumulada, postura promedio, costo por ave, rentabilidad y ocupación del galpón.

## 8. Automatizaciones
- Normalizar código en mayúsculas.
- Calcular edad y semana productiva.
- Alertar sobre capacidad excedida.
- Alertar descarte próximo.
- Bloquear producción en lotes cerrados o descartados.
- Registrar auditoría de altas, cambios de estado, cantidades y ubicación.

## 9. Integraciones
Granjas, Galpones, Razas, Proveedores, Producción diaria, Mortalidad, Alimentación, Sanidad, Calidad, Rentabilidad, Dashboard y Reportes.

## 10. KPIs
Cantidad de lotes activos, aves iniciales, aves actuales, mortalidad acumulada, edad promedio, postura promedio, costo por lote, rentabilidad, lotes próximos a descarte y ocupación por galpón.

## 11. Alertas
Capacidad excedida, cantidad actual inconsistente, lote sin galpón, lote sin raza, descarte próximo, producción en lote cerrado, mortalidad anormal y baja postura.

## 12. Seguridad
RLS por empresa. Las claves compuestas deben impedir cruces entre empresa, granja, galpón, raza y proveedor. El frontend nunca es la autoridad final.

## 13. UX/UI
Vista principal en tabla premium con filtros server-side, búsqueda, paginación y estados visibles. Vista de detalle con resumen productivo y financiero. Formularios compactos en modal o drawer.

## 14. Escalabilidad
La consulta debe paginar en servidor, filtrar por empresa y usar índices por empresa, granja, galpón, estado y fechas. No cargar historiales completos en la lista principal.

## 15. Criterios de aceptación
- Compila sin errores.
- Respeta RLS y permisos.
- No permite cruces multiempresa.
- Paginación y filtros server-side.
- Estados de carga, vacío y error.
- Modal accesible con Escape y autofocus.
- Errores traducidos.
- Auditoría y reglas de negocio verificadas.

## 16. Reglamento obligatorio
Ninguna modificación podrá reducir la cantidad actual, cambiar ubicación, estado o fecha de descarte sin dejar trazabilidad. Ningún lote se eliminará físicamente. Todo cambio que afecte producción, mortalidad o rentabilidad deberá conservar historial.
