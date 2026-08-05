# Ficha corta — Empaque

## Objetivo

Transformar huevos clasificados en unidades comerciales trazables — docenas, bandejas y cajas — controlando cantidades, materiales, operarios y rendimiento.

## Propósito empresarial

- Convertir clasificación en inventario vendible.
- Evitar sobreempaque o doble conteo.
- Medir productividad por operario y turno.
- Controlar consumo de bandejas, cajas y etiquetas.
- Preparar lotes comerciales para inventario, pedidos y ventas.

## Fuente única de verdad

- Clasificación es la autoridad sobre las cantidades disponibles por categoría.
- Empaque solo consume cantidades clasificadas y genera presentaciones comerciales.
- Inventario de huevos será la autoridad sobre existencias disponibles después del empaque.
- Ningún trigger de Empaque modificará Producción Diaria ni Recolección.

## Componentes del Design System

- `PageHeader`
- `AlertBanner`
- `KpiCard`
- `DataTable`
- `Modal`
- `FormField`
- `StatusBadge`

## Tabla principal

Columnas propuestas:

- Fecha
- Lote
- Clasificación
- Presentación
- Cantidad empacada
- Unidades equivalentes
- Operario
- Estado
- Hora de inicio
- Hora de cierre

## Formulario

Campos:

- Producción/clasificación de origen
- Categoría de huevo
- Presentación
- Cantidad de paquetes
- Huevos por paquete
- Bandejas utilizadas
- Cajas utilizadas
- Etiquetas utilizadas
- Operario
- Hora de inicio
- Hora de cierre
- Observaciones

## KPIs

- Huevos empacados hoy
- Bandejas producidas
- Cajas producidas
- Rendimiento por hora
- Pendiente de empacar
- Merma de empaque

## Reglas de negocio

1. Todo empaque pertenece a una empresa y se deriva de una clasificación válida.
2. No se puede empacar más cantidad de una categoría que la disponible en Clasificación.
3. La suma empacada por categoría nunca puede exceder la cantidad clasificada.
4. Un empaque anulado o eliminado lógicamente devuelve disponibilidad a la categoría de origen.
5. La presentación debe indicar cuántos huevos contiene cada unidad.
6. La cantidad total de huevos empacados se calcula en backend.
7. No se permiten cantidades negativas ni cero.
8. La hora de cierre no puede ser anterior a la hora de inicio.
9. No se elimina físicamente ningún registro.
10. Toda creación, edición, cierre, anulación y soft delete queda auditada.
11. La validación de disponibilidad se realiza dentro de una transacción con bloqueo para evitar sobreempaque concurrente.
12. No se modifica `produccion_diaria`, `recolecciones` ni `clasificaciones_huevos` desde triggers de consolidación.

## Estados

- ABIERTO
- CERRADO
- ANULADO

## Permisos

Pueden crear y editar:

- propietario
- administrador
- supervisor
- producción
- inventario

Consulta solo lectura.

## Integraciones

- Clasificación: origen de cantidades disponibles.
- Inventario de huevos: entrada de presentaciones comerciales.
- Ventas: disponibilidad de productos.
- Reportes: productividad, consumo de materiales y trazabilidad.

## Criterios de aceptación

- Usa exclusivamente el Design System aprobado.
- Build y TypeScript limpios.
- RLS multiempresa verificado.
- Sin sobreempaque bajo concurrencia.
- Sin doble autoridad sobre cantidades.
- Migración de Git sincronizada con Supabase.
- Auditoría de Claude sin hallazgos críticos ni altos.
