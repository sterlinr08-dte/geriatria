# Inventario de Huevos

## Objetivo
Controlar existencias reales de huevos empacados por empresa, granja, galpón, lote, clasificación, presentación, fecha de empaque y vencimiento operativo.

## Propósito empresarial
Convertir los movimientos generados por Empaque en disponibilidad comercial confiable para ventas, despacho, trazabilidad, costo y rotación FEFO.

## Fuente única de verdad
Los movimientos de inventario son la única autoridad de existencias. El saldo no se editará directamente.

`Empaque confirmado → movimiento de entrada → saldo disponible`

Las ventas, despachos, ajustes y anulaciones generarán movimientos compensatorios; nunca modificarán manualmente el saldo acumulado.

## Componentes del Design System
- PageHeader
- AlertBanner
- KpiCard
- DataTable
- Modal
- FormField
- StatusBadge

## KPIs
- Unidades disponibles
- Empaques disponibles
- Inventario por presentación
- Inventario por clasificación
- Inventario próximo a vencer
- Inventario vencido
- Valor estimado del inventario
- Días promedio en inventario

## Columnas principales
- Fecha de empaque
- Lote
- Galpón
- Clasificación
- Presentación
- Unidades por empaque
- Empaques disponibles
- Unidades disponibles
- Antigüedad
- Estado FEFO
- Último movimiento

## Filtros
- Granja
- Galpón
- Lote
- Clasificación
- Presentación
- Estado FEFO
- Rango de fechas
- Solo con existencia

## Reglas de negocio
1. El inventario pertenece obligatoriamente a una empresa.
2. No existe edición directa del saldo.
3. Todo cambio de existencia requiere un movimiento inmutable y auditable.
4. Las entradas de Empaque deben referenciar un empaque confirmado y activo.
5. Una anulación de Empaque debe anular o compensar su movimiento sin borrar historial.
6. Las salidas no pueden superar el saldo disponible.
7. La validación de saldo debe ocurrir en backend y bajo bloqueo transaccional.
8. Los despachos deben consumir por FEFO salvo autorización explícita y auditada.
9. No se permiten cruces de empresa en presentación, clasificación, lote, galpón, granja o movimiento.
10. Los movimientos confirmados no se eliminan físicamente.
11. Los ajustes requieren motivo, usuario y evidencia opcional.
12. El saldo se deriva de la suma firmada de movimientos válidos.

## Tipos de movimiento iniciales
- ENTRADA_EMPAQUE
- SALIDA_VENTA
- SALIDA_DESPACHO
- AJUSTE_POSITIVO
- AJUSTE_NEGATIVO
- DEVOLUCION_CLIENTE
- ANULACION

## Estados FEFO
- RECIENTE
- ROTACION_NORMAL
- PROXIMO_A_VENCER
- VENCIDO

Los umbrales serán configurables por empresa y presentación.

## Permisos
Escritura:
- propietario
- administrador
- supervisor
- inventario

Lectura:
- roles con permiso del módulo

Los movimientos automáticos de Empaque serán generados por funciones backend, no por inserción libre del frontend.

## Integraciones
- Empaque: entradas automáticas
- Ventas: reservas y salidas
- Despacho: confirmación física de salida
- Devoluciones: reingreso controlado
- Reportes: rotación, vencimiento, valorización
- Rentabilidad: costo y margen por lote/presentación

## Concurrencia
Toda salida o ajuste negativo debe bloquear el agregado lógico de inventario antes de validar y registrar el movimiento. Dos operaciones simultáneas no pueden consumir las mismas unidades.

## Auditoría
Registrar:
- creación del movimiento
- origen del movimiento
- usuario
- fecha y hora
- cantidad firmada
- saldo resultante o referencia de cálculo
- motivo
- anulación/compensación

## Criterios de aceptación
- TypeScript limpio
- Build limpio
- RLS verificado
- Migraciones sincronizadas
- Sin saldos negativos
- Sin edición directa de saldos
- FEFO determinista
- Integridad multiempresa mediante FKs compuestas y RLS
- Design System reutilizado
- Auditoría de Claude sin hallazgos abiertos
