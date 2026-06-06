'use client'

import { useState, useRef } from 'react'
import { formatearFecha } from '@/lib/utils'

interface Cliente {
  id: number
  nombre: string
  email: string
  telefono: string | null
  direccion: string | null
  activo: boolean
  fechaRegistro: string
  _count: { ordenes: number }
}

interface FormCliente {
  id?: number
  nombre: string
  email: string
  telefono: string
  direccion: string
  password: string
  activo?: boolean
  fechaRegistro?: string
  _count?: { ordenes: number }
}

const VACIO: FormCliente = { nombre: '', email: '', telefono: '', direccion: '', password: '' }

export default function ClientesAdminClient({ clientesIniciales }: { clientesIniciales: Cliente[] }) {
  const [clientes, setClientes] = useState(clientesIniciales)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [actual, setActual] = useState<FormCliente>(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos')
  const [importando, setImportando] = useState(false)
  const [importResult, setImportResult] = useState<{ creados: number; omitidos: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtrados = clientes.filter((c) => {
    const coincide =
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.email.toLowerCase().includes(busqueda.toLowerCase())
    const estadoOk =
      filtro === 'todos' || (filtro === 'activos' ? c.activo : !c.activo)
    return coincide && estadoOk
  })

  function abrirCrear() {
    setActual(VACIO)
    setError('')
    setModal('crear')
  }

  function abrirEditar(c: Cliente) {
    setActual({
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      telefono: c.telefono ?? '',
      direccion: c.direccion ?? '',
      password: '',
      activo: c.activo,
      fechaRegistro: c.fechaRegistro,
      _count: c._count,
    })
    setError('')
    setModal('editar')
  }

  function cerrar() {
    setModal(null)
    setError('')
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    try {
      const esEditar = modal === 'editar'
      const url = esEditar ? `/api/admin/clientes/${actual.id}` : '/api/admin/clientes'
      const method = esEditar ? 'PUT' : 'POST'

      const body: Record<string, unknown> = {
        nombre: actual.nombre,
        email: actual.email,
        telefono: actual.telefono || null,
        direccion: actual.direccion || null,
      }
      if (actual.password) body.password = actual.password

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (esEditar) {
        setClientes((cs) => cs.map((c) => (c.id === data.id ? data : c)))
      } else {
        setClientes((cs) => [data, ...cs])
      }
      cerrar()
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(c: Cliente) {
    const res = await fetch(`/api/admin/clientes/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !c.activo }),
    })
    if (res.ok) {
      const data = await res.json()
      setClientes((cs) => cs.map((x) => (x.id === data.id ? data : x)))
    }
  }

  async function eliminar(c: Cliente) {
    if (!confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/admin/clientes/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      setClientes((cs) => cs.filter((x) => x.id !== c.id))
    } else {
      alert(data.error)
    }
  }

  function exportar() {
    window.open('/api/admin/clientes/exportar', '_blank')
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setImportando(true)
    setImportResult(null)
    try {
      const texto = await archivo.text()
      const res = await fetch('/api/admin/clientes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: texto,
      })
      const result = await res.json()
      if (res.ok) {
        setImportResult(result)
        const fresh = await fetch('/api/admin/clientes')
        if (fresh.ok) setClientes(await fresh.json())
      } else {
        alert(result.error)
      }
    } catch {
      alert('Error al leer el archivo CSV.')
    } finally {
      setImportando(false)
      e.target.value = ''
    }
  }

  const totalActivos = clientes.filter((c) => c.activo).length
  const totalInactivos = clientes.filter((c) => !c.activo).length

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-serif text-2xl text-text-dark">
          Clientes ({clientes.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={abrirCrear} className="btn-primary text-sm px-3 py-2">
            + Nuevo cliente
          </button>
          <button onClick={exportar} className="btn-secondary text-sm px-3 py-2">
            ↓ Exportar CSV
          </button>
          <label className="btn-secondary text-sm px-3 py-2 cursor-pointer">
            {importando ? 'Importando…' : '↑ Importar CSV'}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importar} />
          </label>
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex gap-3 flex-wrap mb-5">
        {[
          { label: 'Total', n: clientes.length, color: 'text-accent' },
          { label: 'Activos', n: totalActivos, color: 'text-green-600' },
          { label: 'Inactivos', n: totalInactivos, color: 'text-text-light' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-card px-4 py-3 flex flex-col items-center min-w-[80px]">
            <span className={`text-2xl font-bold ${s.color}`}>{s.n}</span>
            <span className="text-xs text-text-light mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Resultado importación */}
      {importResult && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          Importación completa: <b>{importResult.creados}</b> creados, <b>{importResult.omitidos}</b> omitidos (duplicados o incompletos).
          <button className="ml-3 text-green-600 underline" onClick={() => setImportResult(null)}>Cerrar</button>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as typeof filtro)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-3 py-3 font-bold">Nombre</th>
                <th className="px-3 py-3 font-bold">Email</th>
                <th className="px-3 py-3 font-bold">Teléfono</th>
                <th className="px-3 py-3 font-bold">Pedidos</th>
                <th className="px-3 py-3 font-bold">Estado</th>
                <th className="px-3 py-3 font-bold">Registrado</th>
                <th className="px-3 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className={`border-b border-primary-dark hover:bg-bg-soft ${!c.activo ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-3 font-medium text-text-dark">{c.nombre}</td>
                  <td className="px-3 py-3 text-text-medium">{c.email}</td>
                  <td className="px-3 py-3 text-text-light">{c.telefono ?? '—'}</td>
                  <td className="px-3 py-3">
                    <span className="bg-primary text-accent-dark font-bold text-xs px-2 py-1 rounded-full">
                      {c._count.ordenes}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-text-light text-xs">{formatearFecha(c.fechaRegistro)}</td>
                  <td className="px-3 py-3">
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
                        onClick={() => eliminar(c)}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2 py-1 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-light">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-primary-dark">
              <h3 className="font-serif text-lg text-text-dark">
                {modal === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}
              </h3>
              <button onClick={cerrar} className="text-text-light hover:text-text-dark text-xl leading-none">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              {[
                { field: 'nombre', label: 'Nombre', type: 'text', required: true },
                { field: 'email', label: 'Email', type: 'email', required: true },
                { field: 'telefono', label: 'Teléfono', type: 'text', required: false },
                { field: 'direccion', label: 'Dirección', type: 'text', required: false },
                { field: 'password', label: modal === 'crear' ? 'Contraseña (mín. 8 caracteres)' : 'Nueva contraseña (dejar vacío para no cambiar)', type: 'password', required: modal === 'crear' },
              ].map(({ field, label, type, required }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-text-medium mb-1">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={type}
                    value={(actual as unknown as Record<string, string>)[field] ?? ''}
                    onChange={(e) => setActual((a) => ({ ...a, [field]: e.target.value }))}
                    className="w-full border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={cerrar} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                {guardando ? 'Guardando…' : modal === 'crear' ? 'Crear cliente' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
