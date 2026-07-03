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
- **CI del molde:** `.github/workflows/deploy.yml` (GitHub Pages) apuntado a la base
  geriátrica correcta. El deploy REAL será Cloudflare Pages (Fase 3).

### PENDIENTES
- **Usuario auth del doctor** en la base nueva (`doctor@geriatra.local`; clave del dueño).
- **Marca/datos reales del doctor** (nombre real, dirección, teléfono, RNC, exequátur):
  el dueño los enviará → cargarlos en `ajustes_negocio` y ajustar branding.
- **Fase 2 — adaptaciones geriátricas:** ficha con **familiar/tutor responsable + su teléfono**,
  **alergias resaltadas en rojo**, condiciones crónicas, medicamentos, ARS, tipo de sangre,
  edad calculada; **signos vitales** en la consulta (presión, pulso, temperatura, peso, glucosa);
  **récipe médico RD imprimible** (℞, Dx, indicaciones, firma y exequátur); **recordatorio de
  citas por WhatsApp**; **reporte de ingresos del mes**.
- **Fase 3 — deploy:** Cloudflare Pages (build `npm run build`, salida `dist`, env
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`), subdominio `geriatra.nexusprord.com`.
  - **SSO (parcial hecho):** en la base madre NEXUS (`tnwsgcxurfyuszxsewsn`), tabla
    `organizaciones`, fila `slug='geriatra'` → ya cargados `nombre`, `color=#5484b4`,
    `auth_url` (base geriatra), `auth_key` (**JWT anon** legacy, 208 chars — mismo patrón que
    Amatista/Deluxe, NO la publishable) y `email_dominio=@geriatra.local`.
  - **Falta el último interruptor:** poner `dominio='geriatra.nexusprord.com'` — SOLO cuando la
    app esté desplegada y viva ahí (poner el dominio apaga el demo de NEXUS y redirige). Con eso
    `doctor@geriatra` en nexusprord.com entra YA LOGUEADO (flujo implícito, hash `#access_token`).
  - ✅ Usuario auth del doctor **ya creado** (ver Fase 0).
  - **Falta el DEPLOY:** en este entorno no hay `wrangler` ni credenciales de Cloudflare, y las
    herramientas MCP de Cloudflare son de solo-lectura (sin deploy de Pages). Para desplegar por
    Cloudflare hace falta un **API token** (permiso *Cloudflare Pages: Edit*) → `wrangler pages
    deploy dist`. Alternativa: GitHub Pages (habilitarlo en Settings → Pages → Source: GitHub Actions).

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
