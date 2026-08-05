# Clasificación — ficha funcional corta

## Objetivo
Clasificar la producción consolidada por tamaño y condición comercial sin alterar el total recolectado.

## Propósito
Convertir la producción diaria en información utilizable para empaque, inventario, calidad y ventas.

## Componentes del Design System
- PageHeader
- KpiCard
- DataTable
- Modal
- FormField
- StatusBadge
- AlertBanner

## Columnas
Fecha, lote, galpón, recolectados, comercializables, merma, estado.

## KPIs
Registros visibles, huevos clasificados, comercializables, merma.

## Reglas
1. Una clasificación por producción diaria.
2. La suma de todas las categorías debe coincidir exactamente con huevos_recolectados.
3. Empresa, granja, galpón, lote y fecha se derivan desde produccion_diaria.
4. No existe un trigger que modifique Producción Diaria desde Clasificación.
5. Producción Diaria es la única fuente del total recolectado.
6. No se elimina físicamente; se anula o elimina lógicamente.
7. La seguridad final depende de RLS.

## Categorías
Jumbo, Extra Grande, Grande, Mediano, Pequeño, Industrial, Sucios, Rotos y Fisurados.

## Criterios de aceptación
- Design System reutilizado sin duplicar tabla, modal, campos, KPIs, alertas ni badges.
- TypeScript y build limpios.
- RLS verificado.
- Migración sincronizada.
- Sin doble conteo ni triggers redundantes.
