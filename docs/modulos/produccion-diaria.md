# Producción Diaria — Ficha de Gobierno Funcional

## 1. Objetivo
Registrar, validar y analizar la producción diaria de huevos por lote y galpón.

## 2. Propósito empresarial
Convertir la recolección diaria en información confiable para medir postura, merma, calidad, productividad y rentabilidad.

## 3. Problema que resuelve
Evita registros dispersos, duplicados, inconsistentes o sin trazabilidad entre lote, galpón, granja y empresa.

## 4. Alcance
Incluye registro diario, clasificación básica, observaciones, indicadores automáticos, filtros e historial. No incluye recolecciones por recorrido, clasificación detallada por tamaño ni empaque.

## 5. Usuarios y permisos
- Propietario y administrador: ver, crear, editar y corregir.
- Supervisor y producción: ver y registrar.
- Veterinario, inventario, ventas y consulta: solo lectura salvo permiso explícito futuro.

## 6. Reglas de negocio
1. Un lote solo puede tener un registro por fecha.
2. El lote debe pertenecer a la empresa activa.
3. La granja y el galpón se derivan del lote en el backend.
4. `aves_vivas_snapshot` se toma de `lotes.cantidad_actual` y no se escribe manualmente.
5. No se admiten fechas futuras.
6. No se registra producción para lotes cerrados o descartados.
7. La suma de huevos clasificados no puede superar los recolectados.
8. Todas las cantidades deben ser enteros no negativos.
9. El porcentaje de postura es `huevos_recolectados / aves_vivas_snapshot * 100`.
10. La merma es la suma de rotos, deformes y descartados sobre recolectados.
11. Los huevos comercializables son buenos más sucios, mientras el negocio no defina otra regla.
12. Toda corrección posterior debe quedar auditada.

## 7. Flujo
Seleccionar fecha → seleccionar lote activo → visualizar granja, galpón y aves actuales → registrar huevos → validar totales → guardar → recalcular indicadores y dashboard.

## 8. Campos
Fecha, lote, huevos recolectados, buenos, rotos, sucios, deformes, descartados y observaciones. Granja, galpón, aves vivas, postura, merma y comercializable son derivados.

## 9. Automatizaciones
Derivar ubicación y aves vivas, impedir duplicados, calcular KPIs, registrar usuario y auditoría, y alimentar dashboard.

## 10. Integraciones
Lotes, galpones, granjas, mortalidad, clasificación, inventario de huevos, calidad, rentabilidad, reportes y dashboard.

## 11. KPIs
Producción total, postura, merma, comercializable, calidad, comparación contra ayer y promedio semanal.

## 12. Alertas
Postura anormal, merma alta, producción cero, caída frente al promedio y clasificación incompleta.

## 13. Seguridad
RLS por empresa y rol; relaciones multiempresa; backend como autoridad de ubicación, snapshot y duplicados.

## 14. UX/UI
Formulario compacto, indicadores en vivo, filtros server-side, estados claros y modal accesible.

## 15. Escalabilidad
Paginación por fecha y lote, índices por empresa/fecha/galpón/lote y preparación futura para partición anual.

## 16. Criterios de aceptación
Build y TypeScript limpios; sin hallazgos críticos o altos; RLS verificado; duplicados imposibles; cálculos consistentes; documentación y migraciones sincronizadas.
