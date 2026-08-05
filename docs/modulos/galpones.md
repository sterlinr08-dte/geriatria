# AVÍCOLA ERP — Gobierno funcional del módulo Galpones

## 1. Objetivo
Administrar cada unidad física de alojamiento avícola, su capacidad, estado operativo, responsable y relación con lotes, producción, sanidad y ambiente.

## 2. Propósito empresarial
Evitar sobreocupación, registros productivos mal asociados, pérdidas por infraestructura inadecuada y falta de trazabilidad por unidad productiva.

## 3. Problema que resuelve
Sin un catálogo confiable de galpones, la empresa no puede saber dónde están las aves, qué capacidad está disponible, qué responsable atiende cada unidad ni qué producción corresponde a cada instalación.

## 4. Alcance
Incluye alta, consulta, edición, desactivación, capacidad, tipo de sistema, ventilación, encargado, estado y relación con granja.

No incluye movimientos de aves, producción diaria, mantenimiento técnico detallado ni controles ambientales; esos procesos pertenecen a módulos especializados.

## 5. Usuarios y permisos
- Propietario: ver, crear, editar, desactivar y exportar.
- Administrador: ver, crear, editar, desactivar y exportar.
- Supervisor: ver, crear y editar; no elimina.
- Producción: consulta operativa.
- Veterinario: consulta.
- Inventario: consulta.
- Ventas: sin acceso operativo salvo permiso explícito.
- Consulta: solo lectura.

RLS es la autoridad final. La interfaz debe ocultar acciones no autorizadas, pero nunca sustituye las políticas de base de datos.

## 6. Reglas de negocio
1. Todo galpón pertenece a una empresa y a una granja de esa misma empresa.
2. El código debe ser único dentro de la granja.
3. La capacidad debe ser mayor que cero.
4. No puede asignarse un encargado de otra empresa.
5. Un galpón con lote activo no puede marcarse como VACÍO.
6. Un galpón en MANTENIMIENTO o INACTIVO no admite nuevos lotes ni producción.
7. No se elimina físicamente; se desactiva mediante estado y soft delete cuando corresponda.
8. La ocupación nunca puede superar la capacidad sin una autorización explícita y auditada.
9. Cambiar la granja de un galpón con historial productivo requiere un proceso controlado; no debe permitirse como edición simple.
10. Toda modificación relevante genera auditoría.

## 7. Flujo operativo
Crear granja → crear galpón → asignar encargado → registrar capacidad y sistema → activar → asignar lote → registrar producción y controles.

## 8. Campos
Obligatorios: empresa, granja, código, nombre, capacidad, tipo de sistema y estado.

Opcionales: ventilación, encargado y fotografía.

Calculados: aves actuales, porcentaje de ocupación, producción diaria, producción semanal y consumo por ave.

## 9. Automatizaciones
- Calcular ocupación.
- Alertar sobreocupación.
- Alertar galpón activo sin lote.
- Bloquear producción en galpón inactivo o en mantenimiento.
- Actualizar KPIs del dashboard.
- Registrar auditoría.

## 10. Integraciones
Granjas, lotes, producción diaria, recolección, alimentación, sanidad, mortalidad, calidad, mantenimiento, reportes y dashboard.

## 11. KPIs
Capacidad, aves actuales, ocupación, postura, producción diaria, mortalidad, consumo, costo por huevo y días sin actividad.

## 12. Alertas
Sobreocupación, producción anormal, mortalidad elevada, falta de encargado, galpón sin lote, mantenimiento vencido y condiciones ambientales fuera de rango.

## 13. Reportes
Galpones por granja, ocupación, capacidad disponible, estado, producción, mortalidad, consumo, rentabilidad e historial.

## 14. Auditoría
Creación, edición, cambio de estado, cambio de encargado, cambio de capacidad, reasignación de granja y desactivación.

## 15. Seguridad
Aislamiento multiempresa mediante claves compuestas y RLS. Todas las operaciones de escritura deben validar rol, empresa activa y pertenencia de la granja y del encargado.

## 16. UX/UI
Vista principal en tarjetas y alternativa tabular. Filtros por granja, estado y tipo. Búsqueda server-side, paginación, modal compacto para alta y drawer para detalle. Botones de tamaño profesional.

## 17. Casos especiales
Sin empresa activa, sin granjas, granja inactiva, código duplicado, capacidad inferior a aves actuales, encargado desactivado, pérdida de conexión y concurrencia de edición.

## 18. Escalabilidad
Las consultas deben filtrar por empresa y granja, usar índices, paginación server-side y no descargar miles de filas al navegador.

## 19. Criterios de aceptación
El módulo se acepta cuando compila, respeta RLS, oculta acciones no autorizadas, maneja carga/error/vacío, funciona con teclado, pagina en servidor y no permite inconsistencias de empresa, granja, capacidad o estado.

## 20. Reglamento obligatorio
Ninguna pantalla, consulta o formulario del módulo se implementará fuera de estas reglas sin documentar y aprobar primero el cambio funcional.
