'use client'

import { useState } from 'react'
import { formatearPrecio, formatearFecha } from '@/lib/utils'

interface Config {
  bannerActivo: boolean
  codigoPromo: string
  descuentoPorcentaje: number
  envioGratisDesde: number
}

interface CodigoPromo {
  id: number
  codigo: string
  descuento: number
  activo: boolean
  descripcion: string | null
  creadoEn: string
}

interface Props {
  configInicial: Config
  codigosIniciales: CodigoPromo[]
}

export default function ConfiguracionClient({ configInicial, codigosIniciales }: Props) {
  const [config, setConfig] = useState(configInicial)
  const [codigos, setCodigos] = useState(codigosIniciales)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [nuevoForm, setNuevoForm] = useState({ codigo: '', descuento: 10, descripcion: '' })
  const [creando, setCreando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  async function guardarConfig() {
    setGuardando(true)
    setGuardado(false)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) { setGuardado(true); setTimeout(() => setGuardado(false), 3000) }
    } finally {
      setGuardando(false)
    }
  }

  async function crearCodigo(e: React.FormEvent) {
    e.preventDefault()
    setErrorForm('')
    setCreando(true)
    try {
      const res = await fetch('/api/admin/codigos-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoForm),
      })
      const data = await res.json()
      if (!res.ok) { setErrorForm(data.error); return }
      setCodigos([data, ...codigos])
      setNuevoForm({ codigo: '', descuento: 10, descripcion: '' })
    } finally {
      setCreando(false)
    }
  }

  async function toggleCodigo(id: number, activo: boolean) {
    const res = await fetch(`/api/admin/codigos-promo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activo }),
    })
    if (res.ok) setCodigos((cs) => cs.map((c) => c.id === id ? { ...c, activo: !activo } : c))
  }

  async function eliminarCodigo(id: number) {
    if (!confirm('¿Eliminar este código?')) return
    const res = await fetch(`/api/admin/codigos-promo/${id}`, { method: 'DELETE' })
    if (res.ok) setCodigos((cs) => cs.filter((c) => c.id !== id))
  }

  async function usarCodigo(codigo: string, descuento: number) {
    setConfig((c) => ({ ...c, codigoPromo: codigo, descuentoPorcentaje: descuento }))
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl text-text-dark mb-8">Configuración de la tienda</h2>

      {/* === BANNER === */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="font-serif text-lg text-text-dark mb-5 pb-3 border-b-2 border-primary-dark">
          Banner superior
        </h3>

        <div className="space-y-5">
          {/* Toggle activo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text-dark text-sm">Mostrar banner</p>
              <p className="text-xs text-text-light">Activa o desactiva la barra de promoción en toda la tienda</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, bannerActivo: !config.bannerActivo })}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.bannerActivo ? 'bg-dulce-green' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.bannerActivo ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Preview del banner */}
          {config.bannerActivo && (
            <div
              className="rounded-lg py-2 px-4 text-white text-sm text-center font-semibold"
              style={{ background: 'linear-gradient(90deg,#c96bc4,#e89ee4,#c96bc4)' }}
            >
              🚀 Envío GRATIS en compras +{formatearPrecio(config.envioGratisDesde)} · Código{' '}
              <strong>{config.codigoPromo}</strong> = {config.descuentoPorcentaje}% OFF 🎀
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Código promocional activo</label>
              <input
                type="text"
                className="form-input uppercase"
                value={config.codigoPromo}
                onChange={(e) => setConfig({ ...config, codigoPromo: e.target.value.toUpperCase() })}
                maxLength={50}
              />
            </div>
            <div>
              <label className="form-label">% de descuento</label>
              <div className="relative">
                <input
                  type="number"
                  className="form-input pr-8"
                  value={config.descuentoPorcentaje}
                  onChange={(e) => setConfig({ ...config, descuentoPorcentaje: Number(e.target.value) })}
                  min={1}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="form-label">Monto mínimo para envío gratis (COP)</label>
              <input
                type="number"
                className="form-input"
                value={config.envioGratisDesde}
                onChange={(e) => setConfig({ ...config, envioGratisDesde: Number(e.target.value) })}
                step={5000}
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={guardarConfig}
            disabled={guardando}
            className="bg-accent text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent-dark transition-all disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {guardado && (
            <span className="text-dulce-green text-sm font-semibold">✓ Guardado correctamente</span>
          )}
        </div>
      </div>

      {/* === CÓDIGOS PROMO === */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-serif text-lg text-text-dark mb-5 pb-3 border-b-2 border-primary-dark">
          Códigos promocionales
        </h3>

        {/* Crear nuevo código */}
        <form onSubmit={crearCodigo} className="bg-bg-soft rounded-xl p-4 mb-6">
          <p className="font-semibold text-text-dark text-sm mb-3">Crear nuevo código</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="form-label">Código *</label>
              <input
                type="text"
                className="form-input uppercase"
                placeholder="PROMO20"
                value={nuevoForm.codigo}
                onChange={(e) => setNuevoForm({ ...nuevoForm, codigo: e.target.value.toUpperCase() })}
                required
                maxLength={50}
              />
            </div>
            <div>
              <label className="form-label">Descuento % *</label>
              <input
                type="number"
                className="form-input"
                value={nuevoForm.descuento}
                onChange={(e) => setNuevoForm({ ...nuevoForm, descuento: Number(e.target.value) })}
                min={1}
                max={100}
                required
              />
            </div>
            <div>
              <label className="form-label">Descripción</label>
              <input
                type="text"
                className="form-input"
                placeholder="Descripción opcional"
                value={nuevoForm.descripcion}
                onChange={(e) => setNuevoForm({ ...nuevoForm, descripcion: e.target.value })}
                maxLength={200}
              />
            </div>
          </div>
          {errorForm && <p className="text-dulce-red text-xs mb-2">{errorForm}</p>}
          <button
            type="submit"
            disabled={creando}
            className="bg-accent text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-accent-dark transition-all disabled:opacity-60"
          >
            {creando ? 'Creando...' : '+ Crear código'}
          </button>
        </form>

        {/* Lista de códigos */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-3 py-2 font-bold rounded-tl-lg">Código</th>
                <th className="px-3 py-2 font-bold">Descuento</th>
                <th className="px-3 py-2 font-bold">Descripción</th>
                <th className="px-3 py-2 font-bold">Estado</th>
                <th className="px-3 py-2 font-bold rounded-tr-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codigos.map((c) => (
                <tr key={c.id} className="border-b border-primary-dark hover:bg-bg-soft">
                  <td className="px-3 py-2.5 font-mono font-bold text-accent">{c.codigo}</td>
                  <td className="px-3 py-2.5 font-bold">{c.descuento}%</td>
                  <td className="px-3 py-2.5 text-text-light text-xs">{c.descripcion ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => toggleCodigo(c.id, c.activo)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${c.activo ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'}`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => usarCodigo(c.codigo, c.descuento)}
                        title="Usar este código en el banner"
                        className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-1 text-xs font-medium text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all"
                      >
                        Usar en banner
                      </button>
                      <button
                        onClick={() => eliminarCodigo(c.id)}
                        className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-1 text-xs font-medium text-text-medium hover:bg-dulce-red hover:text-white hover:border-dulce-red transition-all"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {codigos.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-text-light">Sin códigos creados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
