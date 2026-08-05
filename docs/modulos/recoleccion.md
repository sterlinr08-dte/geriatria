# Ficha de Gobierno Funcional — Recolección

## 1. Objetivo
Registrar cada recorrido de recolección de huevos con trazabilidad por empresa, granja, galpón, lote, fecha, hora, operario y cantidad.

## 2. Propósito empresarial
Convertir la producción diaria en una consolidación verificable, medir productividad operativa y evitar doble captura o doble conteo.

## 3. Alcance
Incluye recorridos múltiples por lote y día, tiempos, operario, sector, cantidad, observaciones, auditoría y consolidación automática en Producción Diaria.

No incluye clasificación, empaque ni inventario final.

## 4. Roles
- Propietario, administrador y supervisor: consultar, registrar, editar, cerrar y anular.
- Producción: consultar, registrar y editar recorridos operativos.
- Consulta y demás roles: solo lectura según permisos y RLS.

## 5. Reglas de negocio
1. Empresa, granja y galpón se derivan del lote en backend.
2. El lote debe estar activo, en desarrollo o producción y tener galpón.
3. No se permiten fechas futuras.
4. El número de recorrido es positivo y único por lote y fecha.
5. La hora final no puede ser anterior a la inicial.
6. La cantidad debe ser un entero no negativo.
7. Los recorridos anulados o eliminados lógicamente no consolidan.
8. La suma consolidada no puede quedar por debajo de huevos ya clasificados.
9. Cada cambio actualiza Producción Diaria dentro de la misma transacción.
10. No se elimina físicamente desde la interfaz.

## 6. Flujo
Lote activo → recorrido → validación backend → consolidación → Producción Diaria → Clasificación.

## 7. Campos
- Fecha
- Lote
- Número de recorrido
- Hora de inicio
- Hora final
- Operario
- Sector
- Cantidad
- Observaciones
- Estado

## 8. Automatizaciones
- Derivar granja y galpón.
- Consolidar cantidad por lote y fecha.
- Crear o actualizar Producción Diaria.
- Auditar inserciones, cambios y anulaciones.
- Calcular duración y rendimiento en frontend/reportes.

## 9. KPIs
- Recorridos del día
- Huevos recolectados
- Tiempo promedio
- Huevos por minuto
- Rendimiento por operario
- Galpones y lotes pendientes

## 10. Seguridad
RLS por empresa y rol, claves foráneas compuestas y funciones `SECURITY DEFINER` sin acceso anónimo.

## 11. Escalabilidad
Índices por empresa-fecha, lote-fecha, galpón-fecha y operario. La consolidación serializa por lote para impedir sumas inconsistentes ante concurrencia.

## 12. Criterios de aceptación
- TypeScript y build limpios.
- Migración sincronizada.
- Sin doble conteo.
- Consolidación transaccional.
- RLS verificado.
- Auditoría de Claude sin hallazgos críticos ni altos.
