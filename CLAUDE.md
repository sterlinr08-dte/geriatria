# CLAUDE.md — CONSULTORIO DR. MARCOS CEPEDA

> Contexto de arranque del proyecto **Consultorio Dr. Marcos Cepeda** (geriatra, cliente del
> ecosistema **NEXUS PRO**, dueño Sterling / sterlinr08@gmail.com).
> Idioma de trabajo: **español** (República Dominicana, `es-DO`). Móvil primero. Estética nivel plus.
> **El chat es desechable; el contexto vive aquí — mantener este archivo al día tras cada cambio importante.**

## Datos del médico (de su tarjeta de presentación)

- **Dr. Marcos Cepeda Espinal** — Geriatra · Enfermedades Neurodegenerativas.
- **Centro:** Hospital Metropolitano de Santiago (HOMS).
- **Dirección:** Autopista Duarte Km 2.8, 5ta Planta, Suite 514, Santiago, R.D.
- **Tel.:** 829-947-2222 Ext. 60514 · **Cel.:** 829-392-7712 / 809-938-0954.
- **Email:** cepedaespinal07@gmail.com.
- **Marca:** nombre en la app = **"Consultorio Dr. Marcos Cepeda"**. Logo real =
  cerebro (azul) + rama de hojas (verde), en `public/logo.png` (favicon `public/favicon.png`).
- **Paleta:** azul cerebro `#5484b4` (principal, `brand`) + verde hoja `#9ccc6c` (acento, `verde`).
  Estos datos de contacto van en `ajustes_negocio` (DB) para récipe/facturas; hay defaults en
  `constants.ts` como respaldo.

---

## Qué es este proyecto

Sistema clínico completo para un **médico geriatra**. Modelo de venta: **base por cliente**
(estilo Infoplus) — el doctor tiene su PROPIA app, su PROPIA base de datos y su subdominio;
nada se cruza con otros clientes. Mismo modelo que **Deluxe** (belleza) y **Amatista Dental**.

**Stack:** Vite + React + TypeScript + Tailwind CSS + Supabase.
**Molde de origen:** `sterlinr08-dte/amatista-dental` (que a su vez clonó de Deluxe).

## Estado actual

### ✅ FASE 0 — Base de datos (hecha desde el chat de NEXUS PRO)
- Proyecto Supabase **"Consultorio Geriatra"** (org `sterlinr08`):
  - **ref / id:** `xqcrpsqhjznltthnfysw`
  - **URL:** `https://xqcrpsqhjznltthnfysw.supabase.co`
  - **anon / publishable key:** NO se guarda como secreto sensible (es pública por diseño,
    protegida por RLS). Obtenerla con Supabase MCP `get_publishable_keys(project_id='xqcrpsqhjznltthnfysw')`.
    La publishable actual es `sb_publishable_90QNK6Ex0T6GmmSo0Kuzsw_gIB9kp9-`.
- Esquema clonado FIEL de Amatista (`sdxyqaawxomnfhyaxuyo`) **sin lo dental**:
  45 tablas con RLS, funciones, triggers. Excluidas: `odontograma`, `periodontograma`,
  `radiografia_hallazgos`, `ordenes_laboratorio`. (`radiografias` se conservó como genérico.)
- ✅ **Usuario auth del doctor CREADO:** `doctor@geriatra.local` (email confirmado, identidad
  email). Perfil **admin** (`roles.key='admin'` con `es_admin=true` → acceso total) y fila en
  `perfiles` (`username='doctor'`, activo). **Clave temporal** entregada por chat (a cambiar;
  **NUNCA en el repo**). Se puede cambiar por SQL o en el panel de Supabase.
  - ⚠️ **GOTCHA (resuelto):** al crear un usuario auth por SQL directo, hay que poner en `''`
    (no NULL) las columnas de token de `auth.users` (`confirmation_token`, `recovery_token`,
    `email_change`, `email_change_token_new`, `email_change_token_current`, `phone_change`,
    `phone_change_token`, `reauthentication_token`); si quedan NULL, GoTrue rechaza el login
    ("Usuario o contraseña incorrectos"). Login por **nexusprord.com** con `doctor@geriatra`
    VERIFICADO funcionando (SSO → entra ya logueado a la app).

### ✅ FASE 1 — Código (LANDEADO en este repo)
Se clonó el molde `amatista-dental`, se **quitaron los módulos dentales** y se **rebrandeó a la
marca real del Dr. Cepeda: azul `#5484b4` + verde `#9ccc6c`** (logo cerebro+hojas).
`npm run build` **VERDE** (1758 módulos). (Nota: en la primera pasada el color fue teal provisional;
al llegar el logo real se cambió a azul+verde.)

Qué se hizo, en concreto:
- **Borrado (dental):** `pages/Odontograma.tsx`, `pages/Periodontograma.tsx`,
  `pages/Radiografias.tsx`, `pages/Laboratorio.tsx`, `components/DienteSVG.tsx`,
  `lib/dental.ts`, `lib/laboratorio.ts`, `lib/radiografias.ts`, `public/dientes/`,
  logos del molde. Tipos dentales muertos removidos de `types.ts`.
- **`src/lib/clinico.ts` (nuevo):** aloja `GRUPOS_SANGUINEOS`, `ESTADOS_PRESUPUESTO` y
  `estadoPresupuestoDef` (antes vivían en `dental.ts`). Importadores actualizados
  (`HistoriaClinica`, `Presupuestos`, `Seguimiento`).
- **Rutas/menú/permisos:** se quitaron odontograma/periodontograma/laboratorio de
  `App.tsx`, `Sidebar.tsx`, `lib/permisos.ts` y de las pestañas de `FichaPaciente.tsx`.
- **Rebrand azul+verde (de raíz):** en `tailwind.config.js` se redefine `brand` al azul del
  logo y se **sobrescriben** las paletas heredadas `amber`/`pink`/`fuchsia` a azul, de modo que
  TODAS las clases heredadas se recolorean solas. Se agrega la paleta `verde` de acento. Los
  hex del molde en `index.css`, `App.tsx` (header), `Sidebar.tsx` y `FichaPaciente.tsx`
  quedaron en azul (`#6c9ccc → #5484b4 → #456f9c`, base `#5484b4`); acento verde `#9ccc6c`.
- **Branding:** `NEGOCIO.nombre='Consultorio Dr. Marcos Cepeda'`, `DOMINIO_USUARIO='@geriatra.local'`,
  logo real `public/logo.png` + `public/favicon.png` (cerebro azul + hojas verdes), `package.json`
  name `consultorio-geriatria`, `index.html` título + theme-color, `public/CNAME=geriatra.nexusprord.com`.
- **Contenido:** consentimientos, categorías de compra/mobiliario y canales de chat
  pasados de dental/belleza a médico genérico.
- **Conexión a la base nueva** vía `.env` (gitignored). `.env.example` documenta las vars.
- **CI:** el workflow de GitHub Pages (`deploy.yml`) se **eliminó** (fallaba en cada push y
  generaba correos; el deploy real es Cloudflare, ver Fase 3).

### PENDIENTES
- **Usuario auth del doctor** en la base nueva (`doctor@geriatra.local`; clave del dueño).
- **Marca/datos reales del doctor** (nombre real, dirección, teléfono, RNC, exequátur):
  el dueño los enviará → cargarlos en `ajustes_negocio` y ajustar branding.
- **Fase 2 — adaptaciones geriátricas (EN CURSO):**
  - ✅ 2.1 Ficha: familiar/tutor responsable + teléfono, **alergias en rojo**, condiciones
    crónicas, medicamentos; se quitó "embarazada". (`HistoriaClinica`, `Clientes`, `FichaPaciente`.)
  - ✅ 2.2 **Récipe médico RD imprimible** (membrete del Dr., ℞, edad, firma/exequátur) en `Recetas`.
  - ✅ 2.3 **Signos vitales** por consulta (TA/FC/FR/SAT/temp/peso/talla/IMC/glucosa) en
    `historia_evoluciones` + `Evoluciones`.
  - ✅ 2.4–2.6 **Valoración Geriátrica Integral**: tabla `valoracion_geriatrica` (escalas +
    secciones narrativas + examen físico) y pestaña **"Valoración"** (`ValoracionGeriatrica.tsx`)
    con interpretación automática de escalas y **botón Imprimir historia clínica** (calca su Word).
  - ✅ 2.7 **Reporte de ingresos del mes** imprimible en `Contabilidad` (facturado/cobrado/
    pendiente + egresos + utilidad; usa `imprimirTabla` de `reportes.ts`).
  - ✅ **Recordatorio de citas por WhatsApp**: ya funcional (click-to-send) en `Citas` y
    `Controles` (`mensajeria.ts` arma el mensaje con `wa_plantilla`).
  - Fase 2 COMPLETA. (Pendiente general: exequátur y ARS del Dr., cuando los envíe.)
- **Fase 3 — "Súper VGI" (EN CURSO):** cerrar huecos vs. mejores programas geriátricos.
  - ✅ 3.1 **Escalas con cálculo automático** (`lib/escalas.ts` + `EscalasGeriatricas.tsx`,
    pestaña "Escalas" en la ficha, tabla `escala_resultados` con histórico): Barthel, Lawton,
    Yesavage GDS-15, Pfeiffer, MNA-SF, Downton, Gijón. Cuestionario → puntaje e interpretación
    automáticos, guardando cada aplicación (habilita gráficos de tendencia).
  - ✅ 3.2 **Gráficos de tendencia** (`TendenciasPaciente.tsx`, pestaña "Tendencias"): líneas
    SVG livianas (sin librerías) de signos vitales (peso, IMC, TA sistólica/diastólica, glucosa,
    FC, SAT) y de los puntajes de escalas en el tiempo. Colores de marca, verificado visualmente.
  - ✅ 3.3 **Medicación y alertas de polifarmacia** (`lib/medicamentos.ts` + `MedicacionPaciente.tsx`,
    pestaña "Medicación" en la ficha, tabla `medicamentos_paciente` con RLS): CRUD de medicación
    (activos/suspendidos), badge de polifarmacia (≥ 5 activos) y **panel de alertas de medicación
    potencialmente inapropiada en el adulto mayor** (lista curada Beers/STOPP: benzodiazepinas,
    hipnóticos Z, antihistamínicos 1.ª gen, tricíclicos, AINEs crónicos, sulfonilureas de acción
    prolongada, relajantes musculares, anticolinérgicos, antipsicóticos, IBP prolongado, etc.).
    `revisarMedicamento()` marca cada fármaco por principio activo con riesgo/sugerencia y gravedad
    (alto/moderado); alerta en vivo al escribir el nombre en el alta. Descargo: ayuda orientativa,
    no sustituye el juicio clínico.
  - ✅ 3.4 **Lista de problemas / diagnósticos CIE-10** (`lib/cie10.ts` + `ProblemasPaciente.tsx`,
    pestaña "Problemas" en la ficha, tabla `problemas_paciente` con RLS): CRUD de la lista de
    problemas (activos/resueltos), marca de **crónico**, fecha de diagnóstico y de resolución.
    `lib/cie10.ts` es un **catálogo CIE-10 curado** (~55 códigos frecuentes en geriatría, por
    sistema) con `buscarCIE10()` (por código o descripción, sin acentos); el buscador autocompleta
    código+diagnóstico y también se puede escribir libre. Botón **Imprimir lista de problemas**
    (activos + resueltos, con membrete del paciente).
  - ✅ 3.5 **Registro de vacunación** (`lib/vacunas.ts` + `VacunasPaciente.tsx`, pestaña
    "Vacunación" en la ficha, tabla `vacunas_paciente` con RLS): registro de dosis (vacuna,
    dosis, fecha, lote, próxima), **panel de próximas dosis/refuerzos** (en X días / hoy /
    vencida), **esquema recomendado del adulto mayor** (`VACUNAS`: influenza, neumococo
    conjugada y polisacárida, herpes zóster, Td/Tdap, COVID-19, hepatitis B) con chips de las
    aún **pendientes de registrar** (click → alta prellenada), botón para sugerir la próxima
    dosis según el esquema y **impresión del carné de vacunación**. `detectarVacuna()` empareja
    el nombre libre con el esquema. Orientativo; el médico decide según el caso.
  - ✅ 3.6 **Plan de cuidados / directivas anticipadas** (`PlanCuidados.tsx`, pestaña "Plan de
    cuidados" en la ficha, tabla `plan_cuidados` con RLS, **un registro por paciente** vía upsert
    on `cliente_id`): objetivos/metas del cuidado, recomendaciones no farmacológicas, cuidador
    principal + teléfono; y **directivas anticipadas** (RCP sí/ONR, nivel de intervención
    completo/hospitalario/confort, nutrición/hidratación artificial, lugar preferido de cuidado,
    representante/decisor sustituto + teléfono, valores y deseos del paciente, observaciones,
    fecha de revisión). Botón **Imprimir** documento con membrete del paciente y líneas de firma
    (paciente/representante y médico). Documento orientativo de planificación.
  - **Fase 3 (3.1–3.6) COMPLETA.**
  - ✅ 3.7 **Mapa del cuerpo humano (Evaluación Geriátrica Integral):** calcado del mockup del Dr.
    **Historia de iteración:** (1) maniquí por código → el dueño quería cuerpo humano real; (2)
    modelo 3D real (Xbot GLB gris, react-three-fiber, rotable) → el dueño quería **la figura que
    envió** (un adulto mayor 2D realista). **Versión final = 2D** con esa figura:
    - `public/cuerpo-geriatria.png`: figura del adulto mayor **recortada de la imagen que envió el
      dueño** (los puntos de color del mockup quedan incrustados y sirven de marcadores de zona).
    - `lib/mapaCorporal.ts`: **11 zonas** (cabeza/nervioso, ojos, oídos, boca/garganta, corazón,
      pulmones, digestivo, urinario, músculoesquelético, piel, pies) con **checklist de síntomas**,
      color de identidad y **posición 2D en %** (`pos`, alineada a los puntos de la figura); 4
      **niveles de alerta** (Sin alteraciones/Leve/Moderado/Severo → verde/amarillo/naranja/rojo).
    - `MapaCorporal2D.tsx`: la figura con las 11 zonas superpuestas (botones tocables invisibles +
      **glow "heatmap"** del color del nivel cuando la zona tiene alteración).
    - `MapaCorporal.tsx`: cuerpo 2D + lista de 11 zonas + editor (nivel + checklist + nota) con
      **upsert por (cliente_id, zona)** en tabla `mapa_corporal` (jsonb `sintomas`, RLS) + leyenda
      + **Reporte imprimible** (figura con zonas encendidas + tabla de hallazgos + descargo).
    - **three.js / react-three-fiber ELIMINADOS del bundle** (ya no se importan; el 2D es liviano).
      `MapaCorporal3D.tsx` y `public/xbot.glb` borrados. Las deps `three/@react-three/*` quedan en
      `package.json` sin usar (se pueden desinstalar).
    - **Pendiente (mejoras):** autollenar zonas desde CIE-10, línea de tiempo por visita; limpiar
      los cabitos de línea que quedaron en la figura recortada (o generar una figura limpia).
  - Pendiente general: exequátur y ARS del Dr.; subdominio bonito.
- **Fase 3 — deploy:** Cloudflare Pages (build `npm run build`, salida `dist`, env
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`), subdominio `geriatra.nexusprord.com`.
  - **SSO (parcial hecho):** en la base madre NEXUS (`tnwsgcxurfyuszxsewsn`), tabla
    `organizaciones`, fila `slug='geriatra'` → ya cargados `nombre`, `color=#5484b4`,
    `auth_url` (base geriatra), `auth_key` (**JWT anon** legacy, 208 chars — mismo patrón que
    Amatista/Deluxe, NO la publishable) y `email_dominio=@geriatra.local`.
  - ✅ **DEPLOY HECHO** (Cloudflare Workers Static Assets, vía dashboard "Import a repository"):
    proyecto `geriatria`, build `npm run build`, deploy `npx wrangler deploy` (config en
    `wrangler.jsonc`, assets=`./dist`, SPA fallback). **URL producción: `https://geriatria.sterlinr08.workers.dev`.**
    Variables de build en Cloudflare: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
    (No se pudo desde este entorno: el proxy bloquea `api.cloudflare.com`; lo montó el dueño por el panel.)
  - ✅ **SSO ACTIVADO:** `organizaciones.slug='geriatra'` con `dominio='geriatria.sterlinr08.workers.dev'`
    → `doctor@geriatra` en nexusprord.com entra YA LOGUEADO. También hay **login propio** en la app
    (App.tsx muestra `pages/Login.tsx` si no hay sesión).
  - ✅ Usuario auth del doctor **ya creado** (ver Fase 0).
  - **Pendiente (cosmético):** subdominio bonito `geriatra.nexusprord.com`. Al agregarlo como dominio
    personalizado del Worker, Cloudflare dijo "ninguna zona coincide" (posible tema de cuenta/zona:
    el Worker y la zona `nexusprord.com` podrían estar en cuentas distintas). Revisar y, cuando esté,
    cambiar `dominio` a `geriatra.nexusprord.com`.

## Comandos

```bash
npm install       # dependencias
npm run dev       # desarrollo local (http://localhost:5173)
npm run build     # build de producción → dist/ (debe quedar VERDE)
npm run lint      # solo chequeo de tipos (tsc --noEmit)
```

Requiere un `.env` (copiar de `.env.example`) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Arquitectura (rápida)

- **Entrada:** no hay login propio; si no hay sesión, `App.tsx` redirige a `nexusprord.com`
  (portal central NEXUS). El SSO se activa en Fase 3.
- **`src/lib/`:** `supabase.ts` (cliente), `auth.tsx` (sesión/permisos), `permisos.ts`
  (catálogo de MÓDULOS = fuente de verdad de menú y permisos), `constants.ts` (NEGOCIO,
  dominio, prefijos, categorías), `negocio.tsx` (ajustes leídos de `ajustes_negocio`),
  `clinico.ts` (grupos sanguíneos, estados de presupuesto), `ecf.ts` (comprobantes DGII),
  `format.ts` (RD$, fechas), `chat.ts`, `documentos.ts` (plantillas imprimibles).
- **`src/pages/`:** una página por módulo. La ficha del paciente (`FichaPaciente.tsx`)
  agrupa las sub-vistas por pestañas.
- **Tema:** azul de marca (`brand`/`azul`) + acento `verde`. NO agregar hex sueltos; usar clases
  Tailwind (`brand-*`, `verde-*`, o las heredadas `amber-*` que ya se recolorean a azul por el
  override del config).

## Reglas del dueño (respetar SIEMPRE)

- **Móvil primero** (iPhone): probar en 320–480px, sin desbordes.
- **Publicar en vivo directo a `main`** (deploy automático); versiones pequeñas y probadas.
  Avisar antes solo si el cambio es grande/riesgoso, y **antes de cada fase**.
- **Arreglos de RAÍZ**, no parches. **Estética = prioridad real (nivel plus).**
- **SIN emojis en la interfaz** (el dueño los considera informales): usar solo iconos
  (lucide) y texto. Ningún hex dorado del molde: todo azul de marca (`brand`) — hay
  `amber`/`gold`/`pink`/`fuchsia` sobrescritos a azul en `tailwind.config.js`.
- Contexto RD: RD$, ITBIS, NCF, cédula, ARS, `es-DO`. **Todo imprimible / PDF / WhatsApp.**
- **Claves y secretos: por chat o server-side. JAMÁS en el repo.**
- **Actualizar este CLAUDE.md tras cada cambio importante.**

## Mapa de sistemas (referencia)

| Sistema | Repo | Base Supabase | Dominio |
|---|---|---|---|
| NEXUS PRO (madre) | `sterlinr08-dte/nexus-pro` | `tnwsgcxurfyuszxsewsn` | nexusprord.com |
| Amatista Dental (MOLDE) | `sterlinr08-dte/amatista-dental` | `sdxyqaawxomnfhyaxuyo` | — |
| **Consultorio Dr. Marcos Cepeda (ESTE)** | `sterlinr08-dte/geriatria` | `xqcrpsqhjznltthnfysw` | geriatra.nexusprord.com |

> Contexto completo original: `sterlinr08-dte/nexus-pro` → `CONSULTORIO-CLAUDE.md`.
