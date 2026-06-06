'use client'

import { useState } from 'react'
import { formatearFecha } from '@/lib/utils'

interface Resena {
  id: number
  nombre: string
  ciudad: string | null
  texto: string
  estrellas: number
  aprobada: boolean
  creadoEn: string
}

const FILTROS = [
  { label: 'Todas', value: 'todas' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Aprobadas', value: 'aprobada' },
  { label: 'Rechazadas', value: 'rechazada' },
]

export default function ResenasAdminClient({ resenasIniciales }: { resenasIniciales: Resena[] }) {
  const [resenas, setResenas] = useState(resenasIniciales)
  const [filtro, setFiltro] = useState('todas')
  const [procesando, setProcesando] = useState<number | null>(null)

  const resenasFiltradas = resenas.filter((r) => {
    if (filtro === 'pendiente') return !r.aprobada
    if (filtro === 'aprobada') return r.aprobada
    if (filtro === 'rechazada') return !r.aprobada
    return true
  })

  // Contadores para los tabs
  const pendientes = resenas.filter((r) => !r.aprobada).length
  const aprobadas = resenas.filter((r) => r.aprobada).length

  async function cambiarEstado(id: number, aprobada: boolean) {
    setProcesando(id)
    const res = await fetch(`/api/admin/resenas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprobada }),
    })
    if (res.ok) {
      setResenas((rs) => rs.map((r) => r.id === id ? { ...r, aprobada } : r))
    }
    setProcesando(null)
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta reseña definitivamente?')) return
    const res = await fetch(`/api/admin/resenas/${id}`, { method: 'DELETE' })
    if (res.ok) setResenas((rs) => rs.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif text-2xl text-text-dark">Reseñas de clientes</h2>
        <div className="flex gap-3 text-sm">
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">{pendientes} pendientes</span>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">{aprobadas} aprobadas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTROS.map((f) => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filtro === f.value ? 'bg-accent text-white' : 'bg-bg-soft border-2 border-primary-dark text-text-medium hover:bg-accent hover:text-white hover:border-accent'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {resenasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <span className="text-4xl block mb-3">💬</span>
          <p className="text-text-medium">No hay reseñas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resenasFiltradas.map((r) => (
            <div key={r.id}
              className={`bg-white rounded-xl shadow-card p-5 border-l-4 ${r.aprobada ? 'border-dulce-green' : 'border-dulce-yellow'}`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-semibold text-text-dark">{r.nombre}</span>
                    {r.ciudad && <span className="text-xs text-text-light">📍 {r.ciudad}</span>}
                    <span className="text-dulce-yellow">{'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.aprobada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {r.aprobada ? 'Publicada' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-text-medium text-sm leading-relaxed italic">"{r.texto}"</p>
                  <p className="text-xs text-text-light mt-2">{formatearFecha(r.creadoEn)}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  {!r.aprobada ? (
                    <button
                      onClick={() => cambiarEstado(r.id, true)}
                      disabled={procesando === r.id}
                      className="bg-green-100 text-green-800 border border-green-300 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      ✓ Aprobar
                    </button>
                  ) : (
                    <button
                      onClick={() => cambiarEstado(r.id, false)}
                      disabled={procesando === r.id}
                      className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      ↩ Despublicar
                    </button>
                  )}
                  <button
                    onClick={() => eliminar(r.id)}
                    className="bg-red-50 text-dulce-red border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
