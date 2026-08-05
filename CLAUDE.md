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

## AL ABRIR ESTE CHAT — empezar por aquí

1. Leer este archivo completo.
2. Si vienes a **desarrollar AVÍCOLA** (ChatGPT): revisar el estado más abajo y usar
   `src/core/modules.ts` como fuente de verdad de módulos/rutas/permisos/sidebar — no dupliques
   catálogos en paralelo.
3. Si vienes a **revisar código** (Claude): pedir el rango de commits exacto y seguir el flujo de
   revisión de arriba (tsc + build + lectura de diff, reporte por gravedad).
4. **Pendientes vivos:**
   - Definir el **esquema de datos real** de AVÍCOLA (granjas, galpones, lotes, producción,
     sanidad, inventario, ventas…) — hoy Fases 1-2 son solo interfaz, sin ninguna tabla ni CRUD
     conectado a Supabase todavía.
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

### ⏳ Pendiente — Fase 3 en adelante (a definir por ChatGPT)
Ningún módulo tiene todavía CRUD real ni tablas propias en Supabase. `ModuloAvicola.tsx` es un
placeholder estático en todas las rutas salvo el Dashboard (también con datos de muestra, sin
conexión real).

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
  es una decisión de arquitectura de datos pendiente, de ChatGPT.**
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
- **`src/design-system/`**: componentes reutilizables del Design System (`PageHeader`,
  `EmptyState`, …).
- **`src/lib/`**: `supabase.ts` (cliente), `auth.tsx` (sesión/permisos vía `puede()`/
  `puedeAccion()`), `permisos.ts` (deriva de `core/modules.ts`).
- **`src/pages/`**: una página por módulo; hoy todas usan `ModuloAvicola.tsx` como placeholder
  salvo `Dashboard.tsx`.
- Páginas/lib clínicas (heredadas del consultorio) siguen presentes en el repo pero **sin ruta
  activa** desde Fase 1 — pendiente decidir si se eliminan o se conservan como referencia.

## Reglas del dueño (heredadas del ecosistema NEXUS PRO — vigentes salvo que se indique lo contrario)

- Móvil primero, sin desbordes horizontales.
- Publicar a `main` en versiones pequeñas y probadas; avisar antes si el cambio es grande/riesgoso.
- **Sin emojis en la interfaz** — solo iconos (lucide) y texto.
- **Claves y secretos: nunca en el repo.**
- **Actualizar este CLAUDE.md tras cada cambio importante.**

---

## Archivo — historial previo: Consultorio Dr. Marcos Cepeda (geriátrico, hasta 2026-08-05)

> Este repo fue originalmente un sistema clínico completo para un médico geriatra (modelo
> "base por cliente" del ecosistema NEXUS PRO, mismo molde que Amatista Dental y Deluxe). El
> Dr. Marcos Cepeda decidió no usar el sistema; el trabajo (Fases 0–5, completo y desplegado en
> su momento) se conserva aquí como **referencia/molde** para un futuro cliente geriátrico.
> - El **código** sigue accesible en el historial de git de esta misma rama hasta el commit
>   `583b0d7` (último estado 100% clínico) — ej. `git checkout 583b0d7 -- src/lib/escalas.ts`.
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
