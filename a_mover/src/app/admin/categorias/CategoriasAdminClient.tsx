'use client'

import { useState } from 'react'

interface Categoria {
  id: number
  nombre: string
  activo: boolean
  orden: number
  creadoEn: string
  _count?: { productos: number }
}

export default function CategoriasAdminClient({
  categoriasIniciales,
}: {
  categoriasIniciales: (Categoria & { _count: { productos: number } })[]
}) {
  const [categorias, setCategorias] = useState(categoriasIniciales)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [actual, setActual] = useState({ nombre: '', orden: 0 })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function abrirCrear() {
    setActual({ nombre: '', orden: categorias.length })
    setEditandoId(null)
    setError('')
    setModal('crear')
  }

  function abrirEditar(c: Categoria) {
    setActual({ nombre: c.nombre, orden: c.orden })
    setEditandoId(c.id)
    setError('')
    setModal('editar')
  }

  function cerrar() {
    setModal(null)
    setError('')
  }

  async function guardar() {
    if (!actual.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setGuardando(true)
    setError('')
    try {
      const esEditar = modal === 'editar'
      const url = esEditar ? `/api/admin/categorias/${editandoId}` : '/api/admin/categorias'
      const method = esEditar ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: actual.nombre.trim(), orden: actual.orden }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (esEditar) {
        setCategorias((cs) =>
          cs.map((c) => (c.id === data.id ? { ...c, ...data } : c))
        )
      } else {
        setCategorias((cs) => [...cs, { ...data, _count: { productos: 0 } }])
      }
      cerrar()
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(c: Categoria) {
    const res = await fetch(`/api/admin/categorias/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !c.activo }),
    })
    if (res.ok) {
      const data = await res.json()
      setCategorias((cs) => cs.map((x) => (x.id === data.id ? { ...x, ...data } : x)))
    }
  }

  async function eliminar(c: Categoria & { _count: { productos: number } }) {
    if (c._count.productos > 0) {
      alert(`No se puede eliminar: ${c._count.productos} producto(s) usan esta categoría.`)
      return
    }
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Esta acción no se puede deshacer.`)) return

    const res = await fetch(`/api/admin/categorias/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setCategorias((cs) => cs.filter((x) => x.id !== c.id))
    } else {
      alert(data.error)
    }
  }

  const activas = categorias.filter((c) => c.activo).length
  const inactivas = categorias.filter((c) => !c.activo).length

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-serif text-2xl text-text-dark">
          Categorías ({categorias.length})
        </h2>
        <button onClick={abrirCrear} className="btn-primary text-sm px-4 py-2">
          + Nueva categoría
        </button>
      </div>

      {/* Mini stats */}
      <div className="flex gap-3 flex-wrap mb-6">
        {[
          { label: 'Total', n: categorias.length, color: 'text-accent', border: 'border-accent' },
          { label: 'Activas', n: activas, color: 'text-green-600', border: 'border-green-400' },
          { label: 'Inactivas', n: inactivas, color: 'text-gray-400', border: 'border-gray-300' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-card px-5 py-3 flex flex-col items-center min-w-[90px] border-t-4 ${s.border}`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.n}</span>
            <span className="text-xs text-text-light mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-4 py-3 font-bold">Nombre</th>
                <th className="px-4 py-3 font-bold text-center">Productos</th>
                <th className="px-4 py-3 font-bold text-center">Orden</th>
                <th className="px-4 py-3 font-bold text-center">Estado</th>
                <th className="px-4 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias
                .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
                .map((c) => (
                  <tr key={c.id} className={`border-b border-primary-dark hover:bg-bg-soft ${!c.activo ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-text-dark">{c.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-primary text-accent-dark font-bold text-xs px-2 py-1 rounded-full">
                        {(c as any)._count?.productos ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-text-light">{c.orden}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="text-xs bg-primary hover:bg-primary-dark text-text-dark font-semibold px-2 py-1 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
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
                          onClick={() => eliminar(c as any)}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2 py-1 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-text-light">Sin categorías registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-light px-4 py-3 border-t border-primary-dark">
          Las categorías inactivas no aparecen en el catálogo ni en el formulario de productos. Solo se pueden eliminar categorías sin productos asociados.
        </p>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-primary-dark">
              <h3 className="font-serif text-lg text-text-dark">
                {modal === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
              </h3>
              <button onClick={cerrar} className="text-text-light hover:text-text-dark text-xl leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <div>
                <label className="block text-xs font-semibold text-text-medium mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={actual.nombre}
                  onChange={(e) => setActual((a) => ({ ...a, nombre: e.target.value }))}
                  className="w-full border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Ej: Cajas de Regalo"
                  maxLength={80}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-medium mb-1">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  min={0}
                  value={actual.orden}
                  onChange={(e) => setActual((a) => ({ ...a, orden: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-text-light mt-1">Número menor = aparece primero en listas.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={cerrar} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : modal === 'crear' ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
