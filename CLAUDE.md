# CLAUDE.md — CONSULTORIO DR. MARCOS CEPEDA

> **ANTES DE HACER O RESPONDER CUALQUIER COSA: leer este archivo completo primero.**
> Es la fuente de verdad del proyecto (estado, decisiones, reglas del dueño, pendientes).
> El chat es desechable; el contexto vive AQUÍ. Alimentarse de este archivo antes de actuar,
> y **mantenerlo al día tras cada cambio importante** (dejarlo listo para el próximo chat).

> Contexto de arranque del proyecto **Consultorio Dr. Marcos Cepeda** (geriatra, cliente del
> ecosistema **NEXUS PRO**, dueño Sterling / sterlinr08@gmail.com).
> Idioma de trabajo: **español** (República Dominicana, `es-DO`). Móvil primero. Estética nivel plus.

## AL ABRIR ESTE CHAT — empezar por aquí

1. **Leer este archivo completo** (estado, reglas, pendientes) antes de actuar.
2. **Prioridad recomendada:** prueba real de la app en producción desde el móvil
   (`geriatra.nexusprord.com`), recorrido de un paciente de punta a punta (crear
   paciente → escalas → medicación → mapa corporal → imprimir historia/récipe),
   cazando desbordes o detalles a 320–480px. Se puede automatizar con Playwright.
3. **Pendientes vivos** (ver detalle en la sección PENDIENTES más abajo):
   - Datos reales del Dr.: **exequátur, RNC, ARS** → cargar en `ajustes_negocio`.
   - ✅ Copiadas y **MEZCLADAS** las 4 skills `nexus-*` a la rama viva de **deluxe**
     (`DELUXE-BEAUTY-CENTER-` → `claude/repo-branding-deluxe-beauty-RpxUZ`) y **bayolcell**
     (`bayolcell-taller` → `main`). Ambos repos ya las heredan en clones nuevos.
   - Confirmar que Cloudflare auto-despliega de `main` y tiene las env vars.
4. **Firecrawl** ya carga en sesión nueva (conector OAuth) para investigar sistemas.

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
  - ✅ 3.7 **Mapa del cuerpo humano (Evaluación Geriátrica Integral):** figura 2D del paciente con
    **marcadores LIBRES**. **Historia de iteración:** (1) maniquí por código → (2) modelo 3D real
    (Xbot GLB, react-three-fiber) → (3) figura 2D del adulto mayor con 11 zonas fijas + heatmap →
    (4) **versión final = pines libres:** el dueño pidió que el médico **ponga el punto donde
    quiera** (ej. si notó algo en las manos), lo mueva, y en cada punto **escriba el hallazgo**.
    - **Figura por sexo × vista:** `public/cuerpo-{hombre,mujer}[-espalda].png` — **4 fotos
      realistas limpias que envió el dueño** (adulto mayor, cuerpo completo, fondo blanco, ropa
      interior gris; frontal y posterior/espalda; recortadas al bounding box, ~460px de ancho).
      `sexoKey(sexo)` (Femenino→mujer; resto→hombre), `figura(sexo, vista)` y `TIENE_ESPALDA`
      en `lib/mapaCorporal.ts`. **Botón Frontal/Posterior** en el mapa; cada marcador guarda su
      `vista` (columna en `mapa_marcadores`) y solo se muestra en esa vista. El **reporte imprime
      ambas vistas**. El selector de sexo en Pacientes solo tiene Masculino/Femenino (sin "Otro").
    - `lib/mapaCorporal.ts`: `NIVELES` (Leve/Moderado/Severo → amarillo/naranja/rojo), `nivelDef`,
      `figuraPorSexo`, `DESCARGO_MAPA`. (Se quitaron las 11 zonas fijas y el heatmap.)
    - `MapaCorporal2D.tsx`: figura + pines. **Tocar el cuerpo agrega un punto** (onClick→%),
      **arrastrar** lo mueve (pointer events + `setPointerCapture`, umbral 1.5% para distinguir
      tap de drag), **tocar un pin** abre su editor. Pines numerados, color por nivel.
    - `MapaCorporal.tsx`: figura por sexo + lista de hallazgos + editor (nivel + **texto libre**
      "¿qué le encontró?") con CRUD en tabla `mapa_marcadores` (x,y en %, nivel, texto; RLS) +
      leyenda + **Reporte imprimible** (figura con los puntos numerados + tabla de hallazgos).
    - Tabla vieja `mapa_corporal` (11 zonas) queda sin uso; la nueva es `mapa_marcadores`.
    - **three.js/react-three-fiber ya NO se importan** (bundle liviano). Deps siguen en package.json.
    - ✅ Hallazgos en **cuadros laterales** (izq/der según el punto) con línea al punto, ancho
      moderado y pegados al cuerpo (`MapaCorporal2D` calcula posiciones con `ResizeObserver`).
    - ✅ **Autollenar desde CIE-10 (AUTOMÁTICO + sincronizado):** al abrir el mapa, `cargar()`
      sincroniza puntos `origen='auto'` con los diagnósticos activos de la Lista de problemas
      (inserta los que faltan por sistema con `posicionSugerida`+`grupoPorCodigo`, borra los de
      diagnósticos ya resueltos/quitados). Columnas `origen`('manual'|'auto') y `codigo` en
      `mapa_marcadores`; los puntos manuales del médico no se tocan. (Nota: si el médico borra un
      punto 'auto' con el diagnóstico aún activo, reaparece al reabrir; para quitarlo, resolver el
      diagnóstico en Problemas.)
- **Fase 3.8 — "Chart Advisor" geriátrico (hecho):**
  - ✅ **Panel de alertas + índice de fragilidad** en la ficha (`components/ResumenAlertas.tsx` +
    `lib/fragilidad.ts`): resumen arriba de la ficha con la **fragilidad** (robusto/leve/moderada/
    severa, orientativa) y **alertas** en vivo (polifarmacia, medicación inapropiada Beers/STOPP,
    vacunas vencidas, escalas en naranja/rojo).
  - ✅ **Mini-Cog** (cribado cognitivo con test del reloj) agregado a `lib/escalas.ts` (aparece solo
    en Escalas/Tendencias/alertas). MoCA/MMSE tienen licencia; Mini-Cog es de uso libre.
  - Pendiente general: exequátur y ARS del Dr.; subdominio bonito.
- **Fase 4 — desprescripción + fragilidad formal (hecho):** cerrar la brecha vs. los mejores
  programas geriátricos del mundo (GEHRIMED/PointClickCare/CGA digital), investigada por WebSearch.
  - ✅ 4.1 **Carga anticolinérgica (ACB) + carga sedante** (`lib/cargaFarmacologica.ts` +
    panel en `MedicacionPaciente.tsx`): `cargaAnticolinergica()` puntúa cada activo por la escala
    **ACB** (1/2/3 por principio activo, lista curada) → total + interpretación (≥3 = carga
    clínicamente significativa: riesgo cognitivo/caídas/mortalidad, valorar desprescribir).
    `cargaSedante()` cuenta fármacos sedantes (aprox. al componente sedante del **Drug Burden
    Index**; el DBI formal necesita dosis). Chips ACB/sedante en el encabezado + panel con
    desglose por fármaco. Orientativo, con descargo.
  - ✅ 4.2 **Índice de fragilidad FORMAL por acumulación de déficits** (Rockwood): `lib/fragilidad.ts`
    ahora devuelve un **índice 0–1** = déficits presentes / evaluados (5 clínicos base + escalas
    aplicadas), con cortes ≤0.12 robusto · ≤0.25 leve · ≤0.40 moderada · >0.40 severa. Suma la
    **carga anticolinérgica alta** como déficit. `ResumenAlertas.tsx` lo alimenta (ACB + nº de
    escalas evaluadas) y muestra el IF y "X de N déficits". No es el eFI validado de 36 ítems.
  - **Fase 4 COMPLETA.** Candidatas futuras (baja prioridad): registro de caídas, úlceras por
    presión sobre el mapa corporal, eMAR ligero, hoja del cuidador imprimible/WhatsApp.
  - ✅ 4.3 **Examen físico por aparatos** (`ValoracionGeriatrica.tsx`): el examen físico dejó de ser
    un textarea libre; ahora es un **editor por sistemas** (`SISTEMAS_EF`, lista del Dr.: Cabeza,
    Ojos, Cuello, Tórax, Corazón, Pulmones, Abdomen, Extremidades sup./inf., Neurológico) con
    etiqueta fija + una línea por sistema; el médico solo escribe el hallazgo. Botón **"Llenar
    normales"** (rellena los vacíos) y **check por sistema** para marcarlo normal; textarea "Otros
    hallazgos". **Sin cambio de esquema:** se serializa a la MISMA columna `examen_fisico` como
    líneas `SISTEMA: hallazgo` (`composeEF`/`parseEF`), así imprime igual y los registros viejos
    (texto libre o con etiquetas, con o sin acento) se leen solos; lo no reconocido va a "Otros".
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
  - ✅ **Subdominio bonito ACTIVADO:** `geriatra.nexusprord.com`. El error "ninguna zona coincide" era
    porque el Worker `geriatria` estaba en una cuenta de Cloudflare **sin** la zona `nexusprord.com`
    (los demás clientes —amatista/deluxe/bayolcell.nexusprord.com— viven en la cuenta que sí tiene la
    zona). Se resolvió agregando el dominio personalizado desde la cuenta correcta (Workers → geriatria
    → Domains & Routes → Custom Domain → `geriatra.nexusprord.com`). **SSO actualizado:** en la base
    madre NEXUS (`tnwsgcxurfyuszxsewsn`), `organizaciones.dominio` de `slug='geriatra'` ahora es
    `geriatra.nexusprord.com` (antes `geriatria.sterlinr08.workers.dev`).
  - **Rutas limpias:** la app usa `BrowserRouter` (no `HashRouter`), así las URLs se ven `/ficha`
    en vez de `/#/ficha` (el fallback SPA de Cloudflare `not_found_handling:single-page-application`
    lo permite). El SSO por `#access_token` sigue funcionando (Supabase lo lee del hash).

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

## Herramientas del asistente (Claude)

- **Firecrawl** (leer/investigar páginas web completas sin que el proxy bloquee, ej. estudiar
  otro sistema para alimentarse): disponible por **conector MCP OAuth** en la cuenta de claude.ai
  del dueño (`sterlinr08@gmail.com`). **NO usa API key en el repo** — es OAuth. Las herramientas
  `firecrawl` (scrape/crawl/search/map) se cargan **al arrancar cada sesión nueva**; una sesión ya
  abierta no las toma hasta reabrirla. **La API key JAMÁS va en este archivo ni en el repo**
  (regla del dueño); si alguna vez se ve una key `fc-...` expuesta, hay que rotarla en el panel.
- **Playwright CLI**: skill instalado en `.claude/skills/playwright-cli/` (automatizar/navegar
  páginas). Chromium ya viene en el entorno (`/opt/pw-browsers`); no correr `playwright install`.

### Skills NEXUS PRO (reutilizables, en `.claude/skills/` — viajan committeadas)
Creadas para todo el ecosistema; **también viven en el molde `amatista-dental`**, así cada
cliente nuevo que se clone las hereda. ✅ Copiadas y mezcladas también en la rama viva de
**deluxe** (`sterlinr08-dte/DELUXE-BEAUTY-CENTER-`, rama `claude/repo-branding-deluxe-beauty-RpxUZ`)
y **bayolcell** (`sterlinr08-dte/bayolcell-taller`, `main`).
- **nexus-convenciones**: reglas fijas del dueño (móvil primero, sin emojis, marca, RD, RLS,
  imprimible/PDF/WhatsApp, deploy a main). Se activa al tocar UI/código.
- **nexus-publicar**: puerta de calidad antes de subir a main (build verde, móvil sin desbordes,
  sin emojis/hex sueltos, **sin secretos en el diff**, CLAUDE.md al día) y luego commit+push.
- **nexus-investigar**: orquesta Firecrawl → Playwright → WebSearch para investigar una página/
  sistema/competidor sorteando el proxy, y entrega un resumen accionable.
- **nexus-nuevo-cliente**: flujo completo para levantar un cliente nuevo desde el molde (base
  Supabase, rebrand, módulos, admin, SSO en NEXUS madre, deploy Cloudflare).

## Mapa de sistemas (referencia)

| Sistema | Repo | Base Supabase | Dominio |
|---|---|---|---|
| NEXUS PRO (madre) | `sterlinr08-dte/nexus-pro` | `tnwsgcxurfyuszxsewsn` | nexusprord.com |
| Amatista Dental (MOLDE) | `sterlinr08-dte/amatista-dental` | `sdxyqaawxomnfhyaxuyo` | — |
| **Consultorio Dr. Marcos Cepeda (ESTE)** | `sterlinr08-dte/geriatria` | `xqcrpsqhjznltthnfysw` | geriatra.nexusprord.com |

> Contexto completo original: `sterlinr08-dte/nexus-pro` → `CONSULTORIO-CLAUDE.md`.
