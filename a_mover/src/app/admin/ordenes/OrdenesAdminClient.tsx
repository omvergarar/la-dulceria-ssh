'use client'

import { useState } from 'react'
import { formatearPrecio, formatearFecha, ESTADOS_ORDEN } from '@/lib/utils'

interface Orden {
  id: number
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string | null
  total: number
  estado: string
  fecha: string
  referenciaPago: string | null
  direccionEnvio: string | null
  notas: string | null
  detalles: Array<{ productoNombre: string; cantidad: number; precioUnitario: number }>
}

const ESTADOS = ['', 'pendiente', 'pagado', 'enviado', 'cancelado']

export default function OrdenesAdminClient({
  ordenesIniciales,
  filtroEstado,
}: {
  ordenesIniciales: Orden[]
  filtroEstado: string
}) {
  const [ordenes, setOrdenes] = useState(ordenesIniciales)
  const [filtro, setFiltro] = useState(filtroEstado)
  const [detalle, setDetalle] = useState<Orden | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState<number | null>(null)

  const ordenesFiltradas = filtro ? ordenes.filter((o) => o.estado === filtro) : ordenes

  async function cambiarEstado(id: number, nuevoEstado: string) {
    setCambiandoEstado(id)
    try {
      const res = await fetch(`/api/admin/ordenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        setOrdenes((os) => os.map((o) => (o.id === id ? { ...o, estado: nuevoEstado } : o)))
        if (detalle?.id === id) setDetalle((d) => d ? { ...d, estado: nuevoEstado } : d)
      }
    } finally {
      setCambiandoEstado(null)
    }
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-text-dark mb-6">
        Órdenes ({ordenesFiltradas.length})
      </h2>

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap mb-5">
        {ESTADOS.map((e) => (
          <button
            key={e || 'todos'}
            onClick={() => setFiltro(e)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filtro === e
                ? 'bg-accent text-white'
                : 'bg-bg-soft border-2 border-primary-dark text-text-medium hover:bg-accent hover:text-white hover:border-accent'
            }`}
          >
            {e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Todas'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-3 py-3 font-bold"># Orden</th>
                <th className="px-3 py-3 font-bold">Cliente</th>
                <th className="px-3 py-3 font-bold">Total</th>
                <th className="px-3 py-3 font-bold">Fecha</th>
                <th className="px-3 py-3 font-bold">Estado</th>
                <th className="px-3 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o) => {
                const estadoInfo = ESTADOS_ORDEN[o.estado as keyof typeof ESTADOS_ORDEN]
                return (
                  <tr key={o.id} className="border-b border-primary-dark hover:bg-bg-soft">
                    <td className="px-3 py-3 font-mono font-bold text-text-dark">#{o.id}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-text-dark">{o.clienteNombre}</div>
                      <div className="text-xs text-text-light">{o.clienteEmail}</div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-accent">{formatearPrecio(o.total)}</td>
                    <td className="px-3 py-3 text-text-light">{formatearFecha(o.fecha)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={o.estado}
                        onChange={(e) => cambiarEstado(o.id, e.target.value)}
                        disabled={cambiandoEstado === o.id}
                        className="text-xs border-2 border-primary-dark rounded-lg px-2 py-1 bg-white focus:border-accent focus:outline-none"
                      >
                        {ESTADOS.filter(Boolean).map((e) => (
                          <option key={e} value={e}>
                            {e.charAt(0).toUpperCase() + e.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setDetalle(o)}
                        className="bg-bg-soft border border-primary-dark rounded-lg px-3 py-1 text-xs font-medium text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                )
              })}
              {ordenesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-light">Sin órdenes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-text-dark/50 z-[800] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-hover" style={{ animation: 'popIn 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl text-text-dark">Orden #{detalle.id}</h3>
              <button onClick={() => setDetalle(null)} className="text-text-light hover:text-text-dark text-2xl">✕</button>
            </div>

            <div className="space-y-3 text-sm mb-5">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="form-label">Cliente</span><p>{detalle.clienteNombre}</p></div>
                <div><span className="form-label">Email</span><p className="text-xs">{detalle.clienteEmail}</p></div>
                {detalle.clienteTelefono && <div><span className="form-label">Teléfono</span><p>{detalle.clienteTelefono}</p></div>}
                {detalle.direccionEnvio && <div><span className="form-label">Dirección</span><p>{detalle.direccionEnvio}</p></div>}
                {detalle.referenciaPago && <div className="col-span-2"><span className="form-label">Ref. pago</span><p className="font-mono text-xs">{detalle.referenciaPago}</p></div>}
                {detalle.notas && <div className="col-span-2"><span className="form-label">Notas</span><p>{detalle.notas}</p></div>}
              </div>
            </div>

            <h4 className="font-serif text-base text-text-dark mb-3 border-t border-primary-dark pt-4">Productos</h4>
            {detalle.detalles.map((d, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-primary-dark last:border-0">
                <span>{d.productoNombre} × {d.cantidad}</span>
                <span className="font-semibold text-accent">{formatearPrecio(d.precioUnitario * d.cantidad)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base text-text-dark pt-3 mt-2 border-t border-primary-dark">
              <span>Total</span>
              <span className="text-accent">{formatearPrecio(detalle.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
