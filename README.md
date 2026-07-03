# 🩺 Consultorio Geriátrico

Sistema clínico para un **consultorio geriátrico**, parte del ecosistema **NEXUS PRO**.
Aplicación web construida con **React + Vite + TypeScript + Tailwind CSS** y **Supabase**
como base de datos. Diseño **móvil primero**, tema **teal médico** (`#0d9488`).

> Derivado del molde `amatista-dental`, quitando los módulos dentales y rebrandeando a
> consultorio médico geriátrico. El contexto y estado del proyecto están en
> [`CLAUDE.md`](./CLAUDE.md).

## ✨ Funcionalidades

- **Panel / Dashboard** — resumen del día: citas, ingresos, pacientes.
- **Citas / Agenda** — agenda diaria, estados (Pendiente/Confirmada/Completada/Cancelada)
  y recordatorios.
- **Pacientes** y **Ficha del paciente** — datos personales, ficha clínica (alergias,
  condiciones, medicamentos, grupo sanguíneo), evoluciones, imágenes/estudios, recetas,
  documentos, consentimientos, planes y facturación en un solo lugar.
- **Historia clínica** y **evoluciones** por visita.
- **Recetas** y **documentos imprimibles** (certificado médico, referimiento, órdenes de
  laboratorio e imágenes).
- **Servicios y precios**, **presupuestos / planes** y **seguimiento**.
- **Facturación** con NCF / e-CF (DGII), ITBIS, **Caja**, cuentas por cobrar/pagar,
  compras, gastos, pagos a empleados, contabilidad, indicadores y reportes.
- **Chat interno**, **tareas**, **avisos**, **alertas** de paciente y control de accesos por rol.

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Estilos | Tailwind CSS |
| Iconos | lucide-react |
| Backend / DB | Supabase (PostgreSQL, RLS) |

## 🚀 Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# edita .env con la URL y la clave (anon/publishable) del proyecto Supabase

# 3. Levantar en desarrollo
npm run dev

# 4. Compilar para producción
npm run build   # salida en dist/
```

Variables (`.env`):

```
VITE_SUPABASE_URL=https://xqcrpsqhjznltthnfysw.supabase.co
VITE_SUPABASE_ANON_KEY=<clave publishable/anon del proyecto>
```

> La clave publishable/anon es pública por diseño (la seguridad la da **RLS**).
> Las contraseñas de usuario y demás secretos **nunca** se guardan en el repo.

## 🔐 Acceso

No hay login propio: la entrada es por el portal central **nexusprord.com** (NEXUS PRO).
Escribiendo `usuario@geriatra` el portal enruta al consultorio ya logueado (SSO, Fase 3).
El usuario del doctor se crea en Supabase Auth de la base del proyecto.

## 📁 Estructura

```
src/
  components/   Componentes reutilizables (Sidebar, Modal, DataTable, chat…)
  lib/          Cliente de Supabase, auth, permisos, formato, clínico, ecf…
  pages/        Una página por módulo (Dashboard, Citas, FichaPaciente, Facturación…)
  types.ts      Tipos del dominio
supabase/
  migrations/   SQL de referencia del esquema base
  functions/    Edge functions (p. ej. gestión de usuarios)
```

## 🚢 Despliegue

Producción en **Cloudflare Pages** (build `npm run build`, salida `dist`, con las env
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`), subdominio `geriatra.nexusprord.com`.
