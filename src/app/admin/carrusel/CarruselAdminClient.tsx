'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FotoC {
  id: number
  url: string
  titulo: string | null
  descripcion: string | null
  orden: number
  activo: boolean
}

export default function CarruselAdminClient({ fotosIniciales }: { fotosIniciales: FotoC[] }) {
  const [fotos, setFotos] = useState(fotosIniciales)
  const [subiendo, setSubiendo] = useState(false)
  const [editando, setEditando] = useState<FotoC | null>(null)
  const [error, setError] = useState('')

  const fotosActivas = fotos.filter((f) => f.activo).length

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    setError('')
    try {
      // Subir imagen al servidor
      const formData = new FormData()
      formData.append('file', archivo)
      const resUpload = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const { url, error: uploadError } = await resUpload.json()
      if (!resUpload.ok) throw new Error(uploadError || 'Error al subir imagen')

      // Crear registro en carrusel
      const res = await fetch('/api/admin/carrusel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, titulo: '', descripcion: '' }),
      })
      const data = await res.json()
      if (res.ok) setFotos((f) => [...f, data])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubiendo(false)
      e.target.value = ''
    }
  }

  async function toggleActivo(foto: FotoC) {
    const res = await fetch(`/api/admin/carrusel/${foto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !foto.activo }),
    })
    if (res.ok) setFotos((fs) => fs.map((f) => f.id === foto.id ? { ...f, activo: !f.activo } : f))
  }

  async function guardarEdicion() {
    if (!editando) return
    const res = await fetch(`/api/admin/carrusel/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: editando.titulo, descripcion: editando.descripcion }),
    })
    if (res.ok) {
      setFotos((fs) => fs.map((f) => f.id === editando.id ? { ...f, ...editando } : f))
      setEditando(null)
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta foto del carrusel?')) return
    const res = await fetch(`/api/admin/carrusel/${id}`, { method: 'DELETE' })
    if (res.ok) setFotos((fs) => fs.filter((f) => f.id !== id))
  }

  async function moverOrden(id: number, direccion: 'arriba' | 'abajo') {
    const idx = fotos.findIndex((f) => f.id === id)
    if (idx === -1) return
    const nuevoIdx = direccion === 'arriba' ? idx - 1 : idx + 1
    if (nuevoIdx < 0 || nuevoIdx >= fotos.length) return

    const nuevasFotos = [...fotos]
    ;[nuevasFotos[idx], nuevasFotos[nuevoIdx]] = [nuevasFotos[nuevoIdx], nuevasFotos[idx]]
    // Actualizar órdenes
    const actualizadas = nuevasFotos.map((f, i) => ({ ...f, orden: i }))
    setFotos(actualizadas)
    // Persistir los dos intercambiados
    await Promise.all([
      fetch(`/api/admin/carrusel/${actualizadas[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: idx }) }),
      fetch(`/api/admin/carrusel/${actualizadas[nuevoIdx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: nuevoIdx }) }),
    ])
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-2xl text-text-dark">🖼️ Carrusel de fotos</h2>
          <p className="text-xs text-text-light mt-1">
            {fotosActivas} foto{fotosActivas !== 1 ? 's' : ''} activa{fotosActivas !== 1 ? 's' : ''} en la página principal
          </p>
        </div>
        {/* Botón subir foto */}
        <label className="bg-accent text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-accent-dark transition-colors cursor-pointer relative">
          {subiendo ? 'Subiendo...' : '+ Agregar foto'}
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full"
            onChange={subirFoto} disabled={subiendo} />
        </label>
      </div>

      {error && <p className="text-dulce-red text-sm mb-4">{error}</p>}

      {fotos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <span className="text-5xl block mb-3">🖼️</span>
          <p className="text-text-medium mb-2">No hay fotos en el carrusel todavía.</p>
          <p className="text-text-light text-sm">Sube la primera foto con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fotos.map((foto, idx) => (
            <div key={foto.id}
              className={`bg-white rounded-xl shadow-card p-4 flex gap-4 items-start border-2 transition-colors ${foto.activo ? 'border-dulce-green/30' : 'border-gray-200 opacity-60'}`}>
              {/* Imagen */}
              <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-primary">
                <Image src={foto.url} alt={foto.titulo ?? 'Carrusel'} fill className="object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-dark text-sm truncate">
                  {foto.titulo || <span className="text-text-light italic">Sin título</span>}
                </p>
                {foto.descripcion && (
                  <p className="text-xs text-text-medium mt-0.5 line-clamp-2">{foto.descripcion}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button onClick={() => setEditando({ ...foto })}
                    className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-0.5 text-xs text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all">
                    ✏️ Editar texto
                  </button>
                  <button onClick={() => toggleActivo(foto)}
                    className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors ${foto.activo ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'}`}>
                    {foto.activo ? '✓ Activa' : '✗ Inactiva'}
                  </button>
                  <button onClick={() => eliminar(foto.id)}
                    className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-0.5 text-xs text-text-medium hover:bg-dulce-red hover:text-white hover:border-dulce-red transition-all">
                    🗑️
                  </button>
                </div>
              </div>

              {/* Ordenar */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => moverOrden(foto.id, 'arriba')} disabled={idx === 0}
                  className="w-7 h-7 bg-bg-soft border border-primary-dark rounded text-xs flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  ▲
                </button>
                <span className="text-[10px] text-text-light text-center">{idx + 1}</span>
                <button onClick={() => moverOrden(foto.id, 'abajo')} disabled={idx === fotos.length - 1}
                  className="w-7 h-7 bg-bg-soft border border-primary-dark rounded text-xs flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar texto */}
      {editando && (
        <div className="fixed inset-0 bg-text-dark/50 z-[800] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-hover" style={{ animation: 'popIn 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg text-text-dark">Editar texto de la foto</h3>
              <button onClick={() => setEditando(null)} className="text-text-light hover:text-text-dark text-2xl">✕</button>
            </div>
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-primary mb-4">
              <Image src={editando.url} alt="" fill className="object-cover" />
            </div>
            <div className="space-y-3">
              <div>
                <label className="form-label">Título (opcional)</label>
                <input type="text" className="form-input"
                  placeholder="Ej: Nueva colección de San Valentín"
                  value={editando.titulo ?? ''}
                  onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                  maxLength={150} />
              </div>
              <div>
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-input resize-none h-20"
                  placeholder="Ej: Descubre nuestros regalos especiales para esta temporada"
                  value={editando.descripcion ?? ''}
                  onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
                  maxLength={300} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditando(null)}
                className="flex-1 border-2 border-primary-dark text-text-medium py-2 rounded-full font-bold hover:border-accent hover:text-accent transition-all">
                Cancelar
              </button>
              <button onClick={guardarEdicion}
                className="flex-1 bg-accent text-white py-2 rounded-full font-bold hover:bg-accent-dark transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
