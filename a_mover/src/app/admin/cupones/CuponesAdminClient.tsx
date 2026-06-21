'use client'

import { useState } from 'react'
import { formatearFecha, formatearPrecio } from '@/lib/utils'

interface CodigoPromo {
  id: number
  codigo: string
  descuento: number
  descripcion: string | null
  activo: boolean
  creadoEn: string
  usos: number
}

interface UsoDetallado {
  id: number
  codigo: string
  clienteId: number
  clienteNombre: string
  clienteEmail: string
  usadoEn: string
  ordenId: number | null
  descuentoAplicado: number | null
  totalOrden: number | null
}

export default function CuponesAdminClient({
  codigos: codigosIniciales,
  usos: usosIniciales,
}: {
  codigos: CodigoPromo[]
  usos: UsoDetallado[]
}) {
  const [codigos, setCodigos] = useState(codigosIniciales)
  const [usos] = useState(usosIniciales)
  const [filtroCodigo, setFiltroCodigo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')

  const usosFiltrados = usos.filter((u) => {
    const coincide =
      u.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.clienteEmail.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.codigo.toLowerCase().includes(busqueda.toLowerCase())
    const codigoOk = filtroCodigo === 'todos' || u.codigo === filtroCodigo
    return coincide && codigoOk
  })

  async function toggleActivo(c: CodigoPromo) {
    const res = await fetch(`/api/admin/codigos-promo/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !c.activo }),
    })
    if (res.ok) {
      const data = await res.json()
      setCodigos((cs) => cs.map((x) => (x.id === data.id ? { ...x, activo: data.activo } : x)))
    }
  }

  async function eliminar(c: CodigoPromo) {
    if (c.usos > 0) { alert(`No se puede eliminar: el código fue usado ${c.usos} vez/veces.`); return }
    if (!confirm(`¿Eliminar el código "${c.codigo}"?`)) return
    const res = await fetch(`/api/admin/codigos-promo/${c.id}`, { method: 'DELETE' })
    if (res.ok) setCodigos((cs) => cs.filter((x) => x.id !== c.id))
  }

  const totalUsos = usos.length
  const totalDescuento = usos.reduce((s, u) => s + (u.descuentoAplicado ?? 0), 0)
  const codigosActivos = codigos.filter((c) => c.activo).length

  return (
    <div>
      <h2 className="font-serif text-2xl text-text-dark mb-6">Cupones de descuento</h2>

      {/* Mini stats globales */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Cupones activos', n: codigosActivos, color: 'text-green-600', border: 'border-green-400', fmt: false },
          { label: 'Total usos', n: totalUsos, color: 'text-accent', border: 'border-accent', fmt: false },
          { label: 'Total descontado', n: totalDescuento, color: 'text-red-500', border: 'border-red-300', fmt: true },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-card px-5 py-3 flex flex-col items-center min-w-[120px] border-t-4 ${s.border}`}>
            <span className={`text-2xl font-bold ${s.color}`}>
              {s.fmt ? formatearPrecio(s.n) : s.n}
            </span>
            <span className="text-xs text-text-light mt-1 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Tabla de códigos ── */}
      <h3 className="font-serif text-lg text-text-dark mb-3">Códigos registrados</h3>
      <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Descuento</th>
                <th className="px-4 py-3 font-bold">Descripción</th>
                <th className="px-4 py-3 font-bold text-center">Usos</th>
                <th className="px-4 py-3 font-bold text-center">Estado</th>
                <th className="px-4 py-3 font-bold">Creado</th>
                <th className="px-4 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codigos.map((c) => (
                <tr key={c.id} className={`border-b border-primary-dark hover:bg-bg-soft ${!c.activo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono font-bold text-accent-dark tracking-wider">{c.codigo}</td>
                  <td className="px-4 py-3 font-semibold text-accent">{c.descuento}%</td>
                  <td className="px-4 py-3 text-text-light text-xs">{c.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setFiltroCodigo(filtroCodigo === c.codigo ? 'todos' : c.codigo)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                        filtroCodigo === c.codigo
                          ? 'bg-accent text-white'
                          : 'bg-primary text-accent-dark hover:bg-primary-dark'
                      }`}
                      title="Filtrar usos por este código"
                    >
                      {c.usos} {c.usos === 1 ? 'uso' : 'usos'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-light text-xs">{formatearFecha(c.creadoEn)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleActivo(c)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                          c.activo
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                        }`}
                      >
                        {c.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminar(c)}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2 py-1 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {codigos.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-text-light">Sin códigos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabla de uso por usuario ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="font-serif text-lg text-text-dark">
          Uso por usuario
          {filtroCodigo !== 'todos' && (
            <span className="ml-2 text-sm font-mono bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {filtroCodigo}
              <button onClick={() => setFiltroCodigo('todos')} className="ml-1 hover:text-accent-dark">✕</button>
            </span>
          )}
        </h3>
        <input
          type="text"
          placeholder="Buscar cliente o código…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-64"
        />
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-4 py-3 font-bold">Cliente</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold text-center">Descuento aplicado</th>
                <th className="px-4 py-3 font-bold text-center">Total orden</th>
                <th className="px-4 py-3 font-bold">Orden #</th>
                <th className="px-4 py-3 font-bold">Fecha de uso</th>
              </tr>
            </thead>
            <tbody>
              {usosFiltrados.map((u) => (
                <tr key={u.id} className="border-b border-primary-dark hover:bg-bg-soft">
                  <td className="px-4 py-3 font-medium text-text-dark">{u.clienteNombre}</td>
                  <td className="px-4 py-3 text-text-medium text-xs">{u.clienteEmail}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-accent-dark bg-primary px-2 py-0.5 rounded">
                      {u.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-red-600 font-semibold">
                    {u.descuentoAplicado != null ? `−${formatearPrecio(u.descuentoAplicado)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-text-dark">
                    {u.totalOrden != null ? formatearPrecio(u.totalOrden) : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-light">
                    {u.ordenId ? `#${u.ordenId}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-light text-xs">{formatearFecha(u.usadoEn)}</td>
                </tr>
              ))}
              {usosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-light">
                    {usos.length === 0 ? 'Ningún cupón ha sido utilizado todavía' : 'Sin resultados para el filtro aplicado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-light px-4 py-3 border-t border-primary-dark">
          {usosFiltrados.length} registro(s) — Haz clic en el contador de usos de un código para filtrar esta tabla.
        </p>
      </div>
    </div>
  )
}
