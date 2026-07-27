import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Printer, Workflow, Eye, EyeOff, ListChecks } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useNegocio } from '../lib/negocio'
import { fechaCorta } from '../lib/format'
import PageHeader from '../components/PageHeader'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'

interface Proceso {
  id: string
  codigo: string | null
  titulo: string
  categoria: string | null
  objetivo: string | null
  responsable: string | null
  pasos: string[]
  notas: string | null
  activo: boolean
  orden: number
  created_at: string
  updated_at: string | null
}

// Categorías sugeridas para los procesos del consultorio (el usuario puede escribir otra).
const CATEGORIAS = [
  'Admisión / Recepción',
  'Citas / Agenda',
  'Consulta',
  'Facturación / Cobro',
  'Caja',
  'Compras / Inventario',
  'Recursos Humanos',
  'Limpieza / Bioseguridad',
  'General',
]

const vacio = { codigo: '', titulo: '', categoria: '', objetivo: '', responsable: '', pasos: '', notas: '' }

// Impresión (membrete del consultorio) de uno o varios procesos en A4.
function imprimirProcesos(
  negocio: { nombre: string; rnc: string; direccion: string; telefono: string },
  tituloDoc: string,
  lista: Proceso[],
) {
  const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const fecha = new Date().toLocaleString('es-DO')
  const bloque = (p: Proceso) => `
    <section class="proc">
      <h1>${p.codigo ? esc(p.codigo) + ' · ' : ''}${esc(p.titulo)}</h1>
      ${p.categoria ? `<p class="meta">Proceso: ${esc(p.categoria)}${p.responsable ? ' · Responsable: ' + esc(p.responsable) : ''}</p>` : p.responsable ? `<p class="meta">Responsable: ${esc(p.responsable)}</p>` : ''}
      ${p.objetivo ? `<p class="obj"><b>Objetivo:</b> ${esc(p.objetivo)}</p>` : ''}
      ${p.pasos.length ? `<ol>${p.pasos.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${p.notas ? `<p class="notas"><b>Notas:</b> ${esc(p.notas)}</p>` : ''}
    </section>`
  const w = window.open('', '_blank', 'width=1000,height=700')
  if (!w) { alert('Permite las ventanas emergentes para imprimir o guardar el PDF.'); return }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(tituloDoc)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#111; margin:0; }
    .hd { text-align:center; margin-bottom:10px; border-bottom:2px solid #5484b4; padding-bottom:6px; }
    .hd h2 { margin:0; font-size:18px; color:#456f9c; }
    .hd p { margin:1px 0; font-size:11px; color:#555; }
    .doc { font-size:15px; font-weight:bold; margin:12px 0 4px; }
    .proc { margin:0 0 16px; padding:0 0 10px; border-bottom:1px solid #e5e7eb; page-break-inside:avoid; }
    .proc h1 { font-size:14px; margin:10px 0 2px; color:#456f9c; }
    .meta { font-size:11px; color:#555; margin:0 0 4px; }
    .obj { font-size:12px; margin:4px 0; }
    ol { margin:4px 0 4px 18px; padding:0; font-size:12px; }
    ol li { margin:2px 0; }
    .notas { font-size:11px; color:#444; margin:4px 0 0; }
    .foot { margin-top:14px; font-size:10px; color:#888; text-align:center; }
  </style></head><body>
    <div class="hd">
      <h2>${esc(negocio.nombre)}</h2>
      ${negocio.rnc ? `<p>RNC: ${esc(negocio.rnc)}</p>` : ''}
      ${negocio.direccion ? `<p>${esc(negocio.direccion)}${negocio.telefono ? ' · Tel ' + esc(negocio.telefono) : ''}</p>` : ''}
    </div>
    <div class="doc">${esc(tituloDoc)}</div>
    ${lista.map(bloque).join('')}
    <p class="foot">Generado el ${fecha}</p>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
  </body></html>`)
  w.document.close()
}

export default function Procesos() {
  const { perfil } = useAuth()
  const { negocio } = useNegocio()
  const admin = !!perfil?.es_admin
  const [items, setItems] = useState<Proceso[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [saving, setSaving] = useState(false)

  async function cargar() {
    const { data } = await supabase.from('procesos').select('*')
      .order('categoria', { ascending: true }).order('orden', { ascending: true }).order('titulo', { ascending: true })
    setItems((data as Proceso[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  function nuevo() { setEditId(null); setForm(vacio); setOpen(true) }
  function editar(p: Proceso) {
    setEditId(p.id)
    setForm({
      codigo: p.codigo ?? '', titulo: p.titulo, categoria: p.categoria ?? '', objetivo: p.objetivo ?? '',
      responsable: p.responsable ?? '', pasos: (p.pasos ?? []).join('\n'), notas: p.notas ?? '',
    })
    setOpen(true)
  }
  async function guardar() {
    if (!form.titulo.trim()) return alert('Escribe el nombre del proceso.')
    setSaving(true)
    const payload = {
      codigo: form.codigo.trim() || null,
      titulo: form.titulo.trim(),
      categoria: form.categoria.trim() || null,
      objetivo: form.objetivo.trim() || null,
      responsable: form.responsable.trim() || null,
      pasos: form.pasos.split('\n').map((s) => s.trim()).filter(Boolean),
      notas: form.notas.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = editId
      ? await supabase.from('procesos').update(payload).eq('id', editId)
      : await supabase.from('procesos').insert(payload)
    setSaving(false)
    if (error) return alert('No se pudo guardar: ' + error.message)
    setOpen(false); cargar()
  }
  async function toggleActivo(p: Proceso) { await supabase.from('procesos').update({ activo: !p.activo }).eq('id', p.id); cargar() }
  async function eliminar(p: Proceso) {
    if (!confirm(`¿Eliminar el proceso "${p.titulo}"?`)) return
    await supabase.from('procesos').delete().eq('id', p.id); cargar()
  }

  // Agrupar por categoría (respetando el orden de carga).
  const grupos: { categoria: string; procesos: Proceso[] }[] = []
  for (const p of items) {
    const cat = p.categoria || 'General'
    let g = grupos.find((x) => x.categoria === cat)
    if (!g) { g = { categoria: cat, procesos: [] }; grupos.push(g) }
    g.procesos.push(p)
  }
  const activos = items.filter((p) => p.activo)

  return (
    <div>
      <PageHeader
        title="Reglamentos / Procesos"
        subtitle="Procesos y reglamentos administrativos del consultorio"
        action={
          <div className="flex flex-wrap gap-2">
            {activos.length > 0 && (
              <button className="btn-ghost" onClick={() => imprimirProcesos(negocio, 'Manual de procesos del consultorio', activos)}>
                <Printer size={16} /> Imprimir manual
              </button>
            )}
            {admin && <button className="btn-primary" onClick={nuevo}><Plus size={16} /> Nuevo proceso</button>}
          </div>
        }
      />

      {loading ? (
        <Cargando />
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <Workflow className="text-brand-300" size={40} />
          <p className="text-slate-500">Aún no hay procesos documentados.</p>
          {admin && <button className="btn-primary" onClick={nuevo}><Plus size={16} /> Documentar el primero</button>}
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <div key={g.categoria}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-600">{g.categoria}</h2>
              <div className="space-y-3">
                {g.procesos.map((p) => (
                  <div key={p.id} className={`card ${!p.activo ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">
                          {p.codigo && <span className="mr-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">{p.codigo}</span>}
                          {p.titulo}
                          {!p.activo && <span className="ml-2 badge bg-slate-200 text-slate-600">Archivado</span>}
                        </p>
                        {p.responsable && <p className="mt-0.5 text-xs text-slate-500">Responsable: {p.responsable}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => imprimirProcesos(negocio, p.titulo, [p])} title="Imprimir" className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600"><Printer size={15} /></button>
                        {admin && <>
                          <button onClick={() => toggleActivo(p)} title={p.activo ? 'Archivar' : 'Reactivar'} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">{p.activo ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                          <button onClick={() => editar(p)} title="Editar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>
                          <button onClick={() => eliminar(p)} title="Eliminar" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                        </>}
                      </div>
                    </div>
                    {p.objetivo && <p className="mt-2 text-sm text-slate-600"><b className="text-slate-700">Objetivo:</b> {p.objetivo}</p>}
                    {p.pasos.length > 0 && (
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                        {p.pasos.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    )}
                    {p.notas && <p className="mt-2 text-xs text-slate-500"><b>Notas:</b> {p.notas}</p>}
                    <p className="mt-2 text-[11px] text-slate-400">Actualizado {fechaCorta(p.updated_at ?? p.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editId ? 'Editar proceso' : 'Nuevo proceso'}
        onClose={() => setOpen(false)}
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Código</label>
              <input className="input" placeholder="PR-01" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Nombre del proceso</label>
              <input className="input" placeholder="Ej. Admisión de paciente nuevo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} autoFocus />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoría</label>
              <input className="input" list="cat-procesos" placeholder="Elige o escribe…" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
              <datalist id="cat-procesos">{CATEGORIAS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label">Responsable</label>
              <input className="input" placeholder="Ej. Recepcionista" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Objetivo</label>
            <textarea className="input" rows={2} placeholder="Para qué sirve este proceso…" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><ListChecks size={14} /> Pasos (uno por línea)</label>
            <textarea className="input font-mono text-xs leading-relaxed" rows={7} placeholder={'1. Recibir al paciente…\n2. Verificar datos…\n3. …'} value={form.pasos} onChange={(e) => setForm({ ...form, pasos: e.target.value })} />
            <p className="mt-1 text-[11px] text-slate-400">Escribe cada paso en su propia línea; se numeran solos.</p>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
