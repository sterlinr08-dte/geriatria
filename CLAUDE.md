# CLAUDE.md — AVÍCOLA ERP

> **ANTES DE HACER O RESPONDER CUALQUIER COSA: leer este archivo completo primero.**
> Es la fuente de verdad del proyecto (estado, decisiones, reglas del dueño, pendientes).
> El chat es desechable; el contexto vive AQUÍ. Alimentarse de este archivo antes de actuar,
> y **mantenerlo al día tras cada cambio importante** (dejarlo listo para el próximo chat).

> **Repo pivotado (2026-08-05):** este repositorio (`sterlinr08-dte/geriatria` en GitHub — el
> nombre del repo aún no se cambió) dejó de ser el Consultorio Dr. Marcos Cepeda y es ahora
> **AVÍCOLA ERP 2026**, un ERP para granjas de gallinas ponedoras. El Dr. Cepeda decidió no usar
> el sistema clínico que se había construido; ese trabajo se **archivó como molde** en vez de
> perderse (ver la última sección de este archivo). Dueño: Sterling (`sterlinr08@gmail.com`).
> Idioma de trabajo: **español**.

## Roles y flujo de trabajo (IMPORTANTE — leer antes de tocar código)

- **ChatGPT** es el arquitecto y desarrollador principal de AVÍCOLA ERP: diseña la arquitectura,
  define el esquema de datos, construye los módulos.
- **Claude** (este asistente) actúa **solo como revisor técnico**: TypeScript, build, dependencias
  circulares, RLS/seguridad de Supabase, calidad de SQL, accesibilidad, correspondencia rutas↔
  permisos, regresiones de autenticación. **No** rediseña pantallas, no cambia arquitectura,
  nombres de tablas/rutas/componentes, no agrega librerías nuevas, no quita funcionalidad — reporta
  hallazgos objetivos (archivo, gravedad, corrección propuesta) y solo se incorporan si hay mejora
  objetiva y lo aprueba el dueño o ChatGPT.
- Todo comentario debe basarse en evidencia técnica (build real, tsc real, SQL real), no en
  preferencia personal.
- **Entrega de los reportes para ChatGPT (regla del dueño):** cuando Claude termine una revisión y
  haya que pasarle los hallazgos a ChatGPT, el mensaje se entrega **como texto plano dentro de un
  bloque de código** (así sale con el botón de copiar y el dueño lo pega directo). No en HTML, no
  como artefacto, no suelto en el chat. Mismo contenido de siempre: veredicto, qué quedó bien,
  hallazgos clasificados por gravedad con archivo/línea/evidencia/corrección.

## AL ABRIR ESTE CHAT — empezar por aquí

1. Leer este archivo completo.
2. Si vienes a **desarrollar AVÍCOLA** (ChatGPT): revisar el estado más abajo y usar
   `src/core/modules.ts` como fuente de verdad de módulos/rutas/permisos/sidebar — no dupliques
   catálogos en paralelo.
3. Si vienes a **revisar código** (Claude): pedir el rango de commits exacto y seguir el flujo de
   revisión de arriba (tsc + build + lectura de diff, reporte por gravedad).
4. **Pendientes vivos:**
   - Continuar con los módulos que siguen siendo placeholder (ver "Estado actual"): el esquema de
     datos real ya está definido y aplicado para la cadena Granjas→Cuentas por Cobrar.
   - ⏳ **Desplegar a Cloudflare** el estado actual de `main`. El deploy es **manual**: el repo no
     tiene GitHub Actions, ni `wrangler.toml`, ni rama `gh-pages`, ni `dist/` versionado, así que
     fusionar a `main` **no publica nada** por sí solo.
   - ⏳ Decidir qué hacer con el **código clínico heredado** que sigue en el árbol (ver abajo).
   - ✅ **SSO desactivado** (2026-08-05): `organizaciones.slug='geriatra'` → `activo=false` en la
     base madre NEXUS PRO. El registro no se borró (reversible), solo dejó de enrutar el login.
   - ⏳ **Renombrar el proyecto Supabase** en el dashboard (sigue mostrando "Consultorio
     Geriatra"; sin API/MCP para esto — paso manual del dueño, ver guía abajo).
   - ⏳ **Renombrar el repo de GitHub** (`geriatria` → algo como `avicola-erp`; sin API/MCP para
     esto tampoco — paso manual del dueño, ver guía abajo).

## Qué es este proyecto

**AVÍCOLA ERP 2026**: ERP para granjas de gallinas ponedoras — producción, sanidad, inventario,
ventas y rentabilidad. Objetivo declarado por el dueño: un ERP premium, superior en UX y
funcionalidad a SAP Fiori, Dynamics 365, NetSuite y Odoo Enterprise.

**Stack:** Vite + React + TypeScript + Tailwind CSS + Supabase (heredado del ecosistema NEXUS PRO,
de donde viene este repo — ver historial archivado al final).

## Estado actual

### ✅ Fase 1 — Núcleo visual (hecho)
Reemplazó el núcleo clínico por: layout enterprise, navbar, sidebar avícola, dashboard ejecutivo
(datos de muestra, sin conexión a datos reales), rutas base de 23 módulos + dashboard, sistema
visual (paleta emerald/amber, sin emojis). Autorización por módulo restaurada (`Protegido` en
`App.tsx`), logout corregido (ya no redirige al portal del consultorio), login y loader
rebrandeados a AVÍCOLA. Revisado por Claude sin errores bloqueantes (TS/build limpios).

### ✅ Fase 2 — Arquitectura centralizada (hecho)
`src/core/modules.ts` es la **única fuente de verdad**: catálogo de 24 módulos (`key`, `path`,
`label`, `description`, `group`, `icon`) del que se derivan las rutas (`App.tsx`), los permisos
(`lib/permisos.ts`) y el sidebar (`components/Sidebar.tsx`) — sin duplicación manual, sin ciclos de
dependencias (verificado). Primeros componentes del Design System: `PageHeader`, `EmptyState` (en
`src/design-system/`), con jerarquía de encabezados y accesibilidad correctas. `ModuloAvicola.tsx`
migrado a esos componentes reutilizables. Revisado por Claude sin errores bloqueantes.

### ✅ Fases 3-10 — Cadena operativa y comercial (hecho, auditado)
Cada módulo se construyó con backend transaccional en Supabase (migración propia, RLS, funciones
`SECURITY DEFINER`, FK compuestas `(id, empresa_id)`, auditoría y `updated_at`) y luego frontend
sobre el Design System. Todos auditados por Claude con pruebas empíricas (SQL real, concurrencia
real en transacciones paralelas, navegador headless sobre el build servido):

| Módulo | Backend | Frontend | Notas |
|---|---|---|---|
| Granjas · Galpones · Lotes | ✅ | ✅ | guard de capacidad de galpón |
| Producción diaria | ✅ | ✅ | snapshot de aves vivas |
| Recolección | ✅ | ✅ | consolidación con índice único parcial |
| Clasificación | ✅ | ✅ | una clasificación activa por producción |
| Empaque | ✅ | ✅ | sincroniza movimiento de inventario por trigger |
| Inventario de huevos | ✅ (vista) | ✅ | saldos derivados, FEFO, `security_invoker` |
| Ventas | ✅ | ✅ | consumo FEFO con `FOR UPDATE`, techo de descuento |
| Cuentas por cobrar | ✅ | ✅ | saldo derivado, abonos, numeración por empresa |

**Patrones establecidos** (respetarlos en módulos nuevos): saldo/estado siempre **derivado**, nunca
columna editable; toda escritura crítica va por RPC `SECURITY DEFINER`, nunca INSERT directo desde
el cliente; concurrencia serializada con `SELECT ... FOR UPDATE` y recálculo **después** del lock;
"como máximo una fila activa" con índice único **parcial** (`WHERE deleted_at IS NULL`); errores de
carga y errores de acción en estados separados (`loadError` / `actionError`) para que un fallo de
acción no borre la tabla; guard de solicitud obsoleta (`requestRef`) en **cada** consulta asíncrona.

### ⏳ Pendiente — módulos aún en placeholder
Siguen usando `ModuloAvicola.tsx`: inventario de alimentos, consumo, sanidad, mortalidad, calidad,
compras, proveedores, clientes, cuentas por pagar, gastos, rentabilidad, reportes y configuración.
El Dashboard sigue con datos de muestra, sin conexión real.

## Base de datos

- Se **reusa el proyecto Supabase de geriatría** (`xqcrpsqhjznltthnfysw`, org `sterlinr08`, plan
  Pro) en vez de crear uno nuevo — decisión del dueño tras confirmar que el Dr. Cepeda no usará el
  sistema clínico. Comparte cuenta/plan con Amatista Dental, NEXUS PRO, BayolCell y Deluxe.
- **2026-08-05 — limpieza:** se eliminaron las 8 tablas exclusivas del sistema clínico
  (`valoracion_geriatrica`, `escala_resultados`, `medicamentos_paciente`, `problemas_paciente`,
  `vacunas_paciente`, `plan_cuidados`, `mapa_corporal`, `mapa_marcadores`). **Respaldadas antes de
  borrar** (DDL + RLS + datos) y entregadas al dueño como archivo aparte — no viven en el repo por
  confidencialidad de datos clínicos. 54 → 46 tablas.
- **Quedan intactas ~45 tablas** heredadas del molde Amatista Dental (`clientes`, `facturas`,
  `empleados`, `compras`, `caja`, `chat`, `tareas`, `avisos`, `roles`, `perfiles`, etc.) + `procesos`
  (genérica — reglamentos/procesos administrativos, reusable tal cual, con RLS "todos leen, solo
  admin edita"). **Su destino para AVÍCOLA — reusar/adaptar columnas vs. reconstruir desde cero —
  es una decisión de arquitectura de datos pendiente, de ChatGPT.** AVÍCOLA **no** las usa: creó
  sus propias tablas (`granjas`, `galpones`, `lotes`, `produccion_diaria`, `clasificaciones_huevos`,
  `empaques_huevos`, `movimientos_inventario_huevos`, `ventas_huevos`, `venta_huevos_detalles`,
  `clientes_comerciales`, `cuentas_por_cobrar`, `movimientos_cxc`, …) más `private.avicola_numeradores`.
- **Roles de `empresa_usuarios.rol`** (CHECK vigente): `propietario`, `administrador`, `supervisor`,
  `produccion`, `empaque`, `veterinario`, `inventario`, `ventas`, `cobranzas`, `consulta`. Si un
  módulo nuevo necesita un rol que no esté en esa lista, hay que **ampliar el CHECK en la misma
  migración**; si no, las políticas RLS que lo mencionen nunca harán match y fallarán en silencio.
- ✅ **TRUNCATE revocado globalmente (2026-08-06):** `anon` y `authenticated` ya no pueden hacer
  TRUNCATE sobre ninguna tabla de `public` (antes lo tenían en 67 tablas por herencia del molde;
  TRUNCATE ignora RLS). Los DEFAULT PRIVILEGES de `postgres` también quedaron sin TRUNCATE, así que
  las tablas futuras nacen endurecidas. **Riesgo latente:** los DEFAULT PRIVILEGES de
  `supabase_admin` sí conservan TRUNCATE y no se pueden modificar sin autorización de plataforma;
  solo aplicarían a una tabla de `public` creada por ese rol, cosa que no ocurre en el flujo de
  migraciones (las 64 tablas son de `postgres`). Chequeo periódico sugerido:
  `select table_name, grantee from information_schema.role_table_grants where privilege_type='TRUNCATE' and grantee in ('anon','authenticated') and table_schema='public';`
- `.env.example` ya documenta que el proyecto es exclusivo de AVÍCOLA (advierte no reusar
  credenciales de otros clientes en producción), pero la URL/anon key siguen siendo las de
  `xqcrpsqhjznltthnfysw` desde que se decidió reusar el proyecto en vez de crear uno nuevo.
- ✅ **SSO desactivado (2026-08-05):** en la base madre NEXUS PRO (`tnwsgcxurfyuszxsewsn`, tabla
  `organizaciones`, fila `slug='geriatra'`) se puso `activo=false`. El registro **no se borró**
  (reversible), pero ya no enruta el login de `nexusprord.com` a este proyecto. Sigue con
  `dominio='geriatra.nexusprord.com'` y `auth_url`/`auth_key` viejos por si se reactiva.
- El usuario `doctor@geriatra.local` (rol admin) sigue existiendo en `auth.users`/`perfiles`/
  `roles` — no se tocó; sirve como cuenta admin de arranque si se reusa para AVÍCOLA, o se puede
  reemplazar/borrar cuando se defina el modelo de usuarios real.

## Pasos manuales pendientes (el dueño, sin API/MCP disponible)

- **Renombrar el proyecto Supabase:** panel de Supabase → proyecto `xqcrpsqhjznltthnfysw` →
  **Settings → General → Project name** → cambiar de "Consultorio Geriatra" a algo como
  "AVÍCOLA ERP". Cosmético, no rompe nada (la `ref`/URL/keys no cambian).
- **Renombrar el repo de GitHub:** `github.com/sterlinr08-dte/geriatria` → **Settings → repository
  name** → cambiar a algo como `avicola-erp`. GitHub deja redirects automáticos del nombre viejo,
  pero conviene avisar si hay CI/Cloudflare apuntando al nombre actual del repo antes de cambiarlo
  (revisar que el deploy de Cloudflare Workers no dependa del nombre exacto del repo).

## Comandos

```bash
npm install
npm run dev       # desarrollo local (http://localhost:5173)
npm run build     # tsc -b && vite build — debe quedar VERDE
```
Requiere `.env` (copiar de `.env.example`) con `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
(proyecto `xqcrpsqhjznltthnfysw`, reusado de geriatría — ver arriba).

## Arquitectura (rápida)

- **`src/core/modules.ts`**: catálogo único de módulos — fuente de verdad de rutas, permisos y
  menú. No dupliques esta información en otro archivo; todo se deriva de aquí.
- **`src/design-system/`**: componentes reutilizables (`PageHeader`, `EmptyState`, `AlertBanner`,
  `KpiCard`, `DataTable`, `Modal`, `FormField`, `StatusBadge`). **Usarlos siempre**: no reinventes
  tablas, modales ni banners con JSX paralelo.
- **`src/lib/`**: `supabase.ts` (cliente), `auth.tsx` (sesión/permisos vía `puede()`/
  `puedeAccion()`), `permisos.ts` (deriva de `core/modules.ts`), `empresa.tsx` (empresa activa),
  `errores.ts` (`traducirError()` — preserva los mensajes de negocio del backend, p. ej. inventario
  insuficiente o techo de descuento; si añades una excepción nueva con texto propio, agrégala ahí o
  el usuario verá el mensaje genérico).
- **`src/pages/`**: una página por módulo. Las de la cadena operativa/comercial son reales; el resto
  sigue usando `ModuloAvicola.tsx` como placeholder.
- **`supabase/migrations/`**: 17 migraciones `*_avicola_*` aplicadas, versionadas en el repo y
  coincidentes con la base real (verificado en cada auditoría).
- **Código clínico heredado:** siguen en el árbol, **sin ruta activa** desde Fase 1, las páginas
  `FichaPaciente`, `EscalasGeriatricas`, `ValoracionGeriatrica`, `MedicacionPaciente`,
  `ProblemasPaciente`, `VacunasPaciente`, `TendenciasPaciente`, `ImagenesPaciente`, `Recetas`, y las
  libs `escalas.ts`, `cie10.ts`, `fragilidad.ts`. Al no estar enrutadas, el tree-shaking las deja
  fuera del bundle (verificado: 0 coincidencias en `dist/`), así que no pesan en producción.
  Pendiente decidir si se eliminan o se conservan como referencia del molde geriátrico.

## Reglas del dueño (heredadas del ecosistema NEXUS PRO — vigentes salvo que se indique lo contrario)

- Móvil primero, sin desbordes horizontales.
- Publicar a `main` en versiones pequeñas y probadas; avisar antes si el cambio es grande/riesgoso.
  **Estado a 2026-08-06:** `main` fue puesto al día con un fast-forward de 108 commits desde
  `claude/sigamos-oaao1q`. Ambas ramas están al mismo commit. Conviene no volver a acumular tanto:
  fusionar a `main` al cerrar cada módulo.
- **Sin emojis en la interfaz** — solo iconos (lucide) y texto.
- **Claves y secretos: nunca en el repo.**
- **Actualizar este CLAUDE.md tras cada cambio importante.**

---

## Archivo — historial previo: Consultorio Dr. Marcos Cepeda (geriátrico, hasta 2026-08-05)

> Este repo fue originalmente un sistema clínico completo para un médico geriatra (modelo
> "base por cliente" del ecosistema NEXUS PRO, mismo molde que Amatista Dental y Deluxe). El
> Dr. Marcos Cepeda decidió no usar el sistema; el trabajo (Fases 0–5, completo y desplegado en
> su momento) se conserva aquí como **referencia/molde** para un futuro cliente geriátrico.
> - El **código no hay que rescatarlo del historial**: buena parte sigue presente en el árbol actual
>   (páginas y libs clínicas sin ruta activa — ver "Arquitectura" arriba). Para el resto, el
>   historial de git lo conserva completo. `583b0d7` es el último commit **antes del pivote
>   documental**, no un estado 100% clínico: para esa fecha las rutas clínicas ya estaban retiradas.
>   El estado clínico íntegro está más atrás, en los commits de las Fases 0-5 (`b24937a` "Ficha:
>   panel de alertas + índice de fragilidad" es el último que tocó `FichaPaciente.tsx`).
> - El **respaldo de base de datos** (DDL + RLS + datos de las 8 tablas clínicas retiradas) se
>   entregó al dueño como archivo aparte el 2026-08-05.
> - Las ~45 tablas base (clientes, facturas, empleados, etc.) **no se borraron** — siguen en el
>   proyecto Supabase reusado por AVÍCOLA (ver sección "Base de datos" arriba).

### Datos del médico (de su tarjeta de presentación)

- **Dr. Marcos Cepeda Espinal** — Geriatra · Enfermedades Neurodegenerativas.
- **Centro:** Hospital Metropolitano de Santiago (HOMS).
- **Dirección:** Autopista Duarte Km 2.8, 5ta Planta, Suite 514, Santiago, R.D.
- **Tel.:** 829-947-2222 Ext. 60514 · **Cel.:** 829-392-7712 / 809-938-0954.
- **Email:** cepedaespinal07@gmail.com.
- **Marca (histórica):** nombre en la app = "Consultorio Dr. Marcos Cepeda". Logo = cerebro (azul)
  + rama de hojas (verde). Paleta: azul cerebro `#5484b4` + verde hoja `#9ccc6c`.

### Qué era este proyecto

Sistema clínico completo para un médico geriatra. Modelo de venta: base por cliente (estilo
Infoplus) — el doctor tenía su propia app, su propia base de datos y su subdominio.

**Molde de origen:** `sterlinr08-dte/amatista-dental` (que a su vez clonó de Deluxe).

### Fases completadas (histórico)

- **Fase 0** — Base de datos: proyecto Supabase "Consultorio Geriatra" (`xqcrpsqhjznltthnfysw`),
  esquema clonado fiel de Amatista sin lo dental (45 tablas con RLS, funciones, triggers). Usuario
  auth del doctor creado (`doctor@geriatra.local`, admin).
- **Fase 1** — Código: molde `amatista-dental` clonado, módulos dentales quitados, rebrandeo azul
  `#5484b4` + verde `#9ccc6c` (logo cerebro+hojas). Build verde.
- **Fase 2** — Adaptaciones geriátricas: ficha con familiar/tutor responsable, alergias en rojo,
  condiciones crónicas; récipe médico RD imprimible; signos vitales por consulta; Valoración
  Geriátrica Integral con interpretación automática; reporte de ingresos del mes; recordatorio de
  citas por WhatsApp.
- **Fase 3 — "Súper VGI":** escalas geriátricas con cálculo automático (Barthel, Lawton, Yesavage
  GDS-15, Pfeiffer, MNA-SF, Downton, Gijón, Mini-Cog) con histórico y gráficos de tendencia;
  medicación con alertas de polifarmacia y medicación potencialmente inapropiada (Beers/STOPP);
  lista de problemas con catálogo CIE-10 curado (~55 códigos); registro de vacunación con esquema
  recomendado del adulto mayor; plan de cuidados y directivas anticipadas; mapa del cuerpo humano
  con marcadores libres por sexo/vista, autollenado desde CIE-10; panel de alertas + índice de
  fragilidad orientativo en la ficha.
- **Fase 4** — Desprescripción + fragilidad formal: carga anticolinérgica (escala ACB) y carga
  sedante (aprox. Drug Burden Index) con panel e interpretación; índice de fragilidad formal por
  acumulación de déficits (modelo Rockwood, 0–1, con cortes robusto/leve/moderada/severa); examen
  físico por aparatos (editor por sistemas en vez de texto libre).
- **Fase 5** — Reglamentos / Procesos administrativos: módulo para documentar procesos operativos
  del consultorio (no clínico), con impresión de manual completo. (Esta tabla `procesos` **sí se
  conservó** — es genérica y la hereda AVÍCOLA.)
- **Deploy:** Cloudflare Workers Static Assets, dominio `geriatra.nexusprord.com`, SSO con la base
  madre NEXUS PRO activado. Deploy verificado funcionando antes del pivote a AVÍCOLA.

### Mapa de sistemas (histórico, previo al pivote)

| Sistema | Repo | Base Supabase | Dominio |
|---|---|---|---|
| NEXUS PRO (madre) | `sterlinr08-dte/nexus-pro` | `tnwsgcxurfyuszxsewsn` | nexusprord.com |
| Amatista Dental (MOLDE) | `sterlinr08-dte/amatista-dental` | `sdxyqaawxomnfhyaxuyo` | — |
| Consultorio Dr. Marcos Cepeda (histórico, ahora AVÍCOLA) | `sterlinr08-dte/geriatria` | `xqcrpsqhjznltthnfysw` | geriatra.nexusprord.com *(SSO pendiente de actualizar)* |

> Contexto completo original: `sterlinr08-dte/nexus-pro` → `CONSULTORIO-CLAUDE.md`.
