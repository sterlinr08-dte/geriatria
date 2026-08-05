import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export type EmpresaActiva = {
  id: string
  nombre: string
  rol: string
}

type EmpresaContextValue = {
  empresas: EmpresaActiva[]
  empresaActiva: EmpresaActiva | null
  setEmpresaActivaId: (id: string) => void
  loading: boolean
  error: string | null
  recargar: () => Promise<void>
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null)
const STORAGE_KEY = 'avicola_empresa_activa'

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [empresas, setEmpresas] = useState<EmpresaActiva[]>([])
  const [empresaActivaId, setEmpresaActivaIdState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = async () => {
    if (!session?.user?.id) {
      setEmpresas([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id, rol, empresas!inner(id,nombre)')
      .eq('usuario_id', session.user.id)
      .eq('activo', true)

    if (queryError) {
      setError(queryError.message)
      setEmpresas([])
      setLoading(false)
      return
    }

    const normalizadas = (data || []).map((fila: any) => ({
      id: fila.empresa_id,
      nombre: fila.empresas?.nombre || 'Empresa sin nombre',
      rol: fila.rol,
    })) as EmpresaActiva[]

    setEmpresas(normalizadas)
    const existeSeleccion = normalizadas.some((empresa) => empresa.id === empresaActivaId)
    const siguiente = existeSeleccion ? empresaActivaId : normalizadas[0]?.id || ''
    setEmpresaActivaIdState(siguiente)
    if (siguiente) localStorage.setItem(STORAGE_KEY, siguiente)
    setLoading(false)
  }

  useEffect(() => {
    void recargar()
  }, [session?.user?.id])

  const setEmpresaActivaId = (id: string) => {
    setEmpresaActivaIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const empresaActiva = useMemo(
    () => empresas.find((empresa) => empresa.id === empresaActivaId) || empresas[0] || null,
    [empresas, empresaActivaId],
  )

  return (
    <EmpresaContext.Provider value={{ empresas, empresaActiva, setEmpresaActivaId, loading, error, recargar }}>
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (!context) throw new Error('useEmpresa debe usarse dentro de EmpresaProvider')
  return context
}
