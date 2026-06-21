'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatearPrecio } from '@/lib/utils'

interface Foto { id: number; url: string; orden: number }

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  imagenUrl: string | null
  activo: boolean
  fotos?: Foto[]
}

const MAX_FOTOS = 3

export default function ProductosAdminClient({
  productosIniciales,
  categoriasDisponibles,
}: {
  productosIniciales: Producto[]
  categoriasDisponibles: string[]
}) {
  const PROD_VACIO: Omit<Producto, 'id' | 'activo' | 'fotos'> = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: categoriasDisponibles[0] ?? '',
    imagenUrl: null,
  }
  const [productos, setProductos] = useState(productosIniciales)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  // 'form' = llenando datos del producto | 'fotos' = subiendo fotos (solo en crear)
  const [paso, setPaso] = useState<'form' | 'fotos'>('form')
  const [productoActual, setProductoActual] = useState<Partial<Producto>>(PROD_VACIO)
  const [fotosActuales, setFotosActuales] = useState<Foto[]>([])
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroStock, setFiltroStock] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Para el filtro de categoría usamos las que existen en los productos visibles
  const categoriasEnProductos = [...new Set(productos.map((p) => p.categoria).filter(Boolean))]

  const productosFiltrados = productos.filter((p) => {
    if (!p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false
    if (filtroEstado === 'activos' && !p.activo) return false
    if (filtroEstado === 'inactivos' && p.activo) return false
    if (filtroStock === 'en-stock' && !(p.activo && p.stock > 3)) return false
    if (filtroStock === 'ultimas' && !(p.activo && p.stock > 0 && p.stock <= 3)) return false
    if (filtroStock === 'agotados' && !(p.activo && p.stock === 0)) return false
    return true
  })

  const hayFiltros = filtroCategoria !== 'todas' || filtroStock !== 'todos' || filtroEstado !== 'todos'

  function limpiarFiltros() {
    setFiltroCategoria('todas')
    setFiltroStock('todos')
    setFiltroEstado('todos')
    setBusqueda('')
  }

  async function abrirEditar(p: Producto) {
    setProductoActual({ ...p })
    setError('')
    setPaso('form')
    const res = await fetch(`/api/admin/productos/${p.id}/fotos`)
    const fotos = res.ok ? await res.json() : []
    setFotosActuales(fotos)
    setModal('editar')
  }

  function abrirCrear() {
    setProductoActual(PROD_VACIO)
    setFotosActuales([])
    setPaso('form')
    setModal('crear')
    setError('')
  }

  function cerrarModal() {
    setModal(null)
    setPaso('form')
    setFotosActuales([])
  }

  async function subirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!productoActual.id) return
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (fotosActuales.length >= MAX_FOTOS) { setError(`Máximo ${MAX_FOTOS} fotos`); return }

    setSubiendo(true)
    const formData = new FormData()
    formData.append('file', archivo)
    const res = await fetch(`/api/admin/productos/${productoActual.id}/fotos`, { method: 'POST', body: formData })
    const data = await res.json()
    if (res.ok) {
      setFotosActuales((f) => [...f, data])
      if (fotosActuales.length === 0) {
        setProductoActual((p) => ({ ...p, imagenUrl: data.url }))
        setProductos((ps) => ps.map((p) => p.id === productoActual.id ? { ...p, imagenUrl: data.url } : p))
      }
    } else {
      setError(data.error)
    }
    setSubiendo(false)
    e.target.value = ''
  }

  async function eliminarFoto(fotoId: number) {
    if (!productoActual.id) return
    const res = await fetch(`/api/admin/productos/${productoActual.id}/fotos?fotoId=${fotoId}`, { method: 'DELETE' })
    if (res.ok) {
      const nuevasFotos = fotosActuales.filter((f) => f.id !== fotoId)
      setFotosActuales(nuevasFotos)
      const nuevaPrimera = nuevasFotos[0]?.url ?? null
      setProductoActual((p) => ({ ...p, imagenUrl: nuevaPrimera }))
      setProductos((ps) => ps.map((p) => p.id === productoActual.id ? { ...p, imagenUrl: nuevaPrimera } : p))
    }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!productoActual.nombre || !productoActual.precio) { setError('Nombre y precio son obligatorios'); return }
    setGuardando(true); setError('')
    try {
      const esEditar = modal === 'editar' && productoActual.id
      const url = esEditar ? `/api/admin/productos/${productoActual.id}` : '/api/admin/productos'
      const method = esEditar ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoActual),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      const precio = Number(data.precio)

      if (esEditar) {
        setProductos((ps) => ps.map((p) => p.id === data.id ? { ...p, ...data, precio } : p))
        cerrarModal()
      } else {
        // Producto creado: guardarlo en la lista y pasar al paso de fotos
        setProductos((ps) => [{ ...data, precio, fotos: [] }, ...ps])
        setProductoActual({ ...data, precio })
        setPaso('fotos')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Desactivar este producto?')) return
    const res = await fetch(`/api/admin/productos/${id}`, { method: 'DELETE' })
    if (res.ok) setProductos((ps) => ps.map((p) => p.id === id ? { ...p, activo: false } : p))
  }

  async function handleToggleActivo(p: Producto) {
    const res = await fetch(`/api/admin/productos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, activo: !p.activo }),
    })
    if (res.ok) setProductos((ps) => ps.map((x) => x.id === p.id ? { ...x, activo: !x.activo } : x))
  }

  // Sección de fotos reutilizada en crear (paso='fotos') y editar
  function SeccionFotos() {
    return (
      <div className="mt-6 pt-5 border-t-2 border-primary-dark">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-serif text-base text-text-dark">
            Fotos del producto
            <span className="text-xs font-sans font-normal text-text-light ml-2">
              ({fotosActuales.length}/{MAX_FOTOS})
            </span>
          </h4>
        </div>

        <div className="flex gap-3 flex-wrap mb-3">
          {fotosActuales.map((foto, idx) => (
            <div key={foto.id} className="relative w-24 h-24 rounded-lg overflow-hidden bg-primary group">
              <Image src={foto.url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-accent/80 text-white text-[10px] text-center py-0.5">
                  Principal
                </span>
              )}
              <button
                onClick={() => eliminarFoto(foto.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-dulce-red text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Eliminar foto"
              >✕</button>
            </div>
          ))}

          {fotosActuales.length < MAX_FOTOS && (
            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-accent flex flex-col items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors relative">
              {subiendo ? (
                <span className="text-xs text-text-medium">Subiendo...</span>
              ) : (
                <>
                  <span className="text-2xl text-accent">+</span>
                  <span className="text-[10px] text-text-light mt-0.5">Agregar foto</span>
                </>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={subirFoto} disabled={subiendo} />
            </label>
          )}
        </div>
        <p className="text-xs text-text-light">
          La primera foto se usa como imagen principal en el catálogo. JPG, PNG o WEBP, máx. 5 MB c/u.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-serif text-2xl text-text-dark">Productos ({productos.length})</h2>
        <button onClick={abrirCrear} className="bg-accent text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-accent-dark transition-colors">
          + Nuevo producto
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <input type="text" placeholder="Buscar producto..." className="form-input pl-8 text-sm w-full"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">🔍</span>
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="todas">Todas las categorías</option>
          {categoriasEnProductos.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filtroStock}
          onChange={(e) => setFiltroStock(e.target.value)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="todos">Todo el stock</option>
          <option value="en-stock">🟢 En stock (&gt;3)</option>
          <option value="ultimas">🟡 Últimas unidades (1-3)</option>
          <option value="agotados">🔴 Agotados (0)</option>
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border border-primary-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="text-sm text-text-light hover:text-accent underline whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <p className="text-xs text-text-light mb-3">
        {productosFiltrados.length === productos.length
          ? `${productos.length} productos`
          : `${productosFiltrados.length} de ${productos.length} productos`}
      </p>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-3 py-3 font-bold">Fotos</th>
                <th className="px-3 py-3 font-bold">Nombre</th>
                <th className="px-3 py-3 font-bold">Categoría</th>
                <th className="px-3 py-3 font-bold">Precio</th>
                <th className="px-3 py-3 font-bold">Stock</th>
                <th className="px-3 py-3 font-bold">Estado</th>
                <th className="px-3 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p.id} className="border-b border-primary-dark hover:bg-bg-soft">
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {p.imagenUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary flex-shrink-0">
                          <Image src={p.imagenUrl} alt={p.nombre} width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-lg flex-shrink-0">🎁</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium text-text-dark max-w-[180px] truncate">{p.nombre}</td>
                  <td className="px-3 py-2 text-text-light text-xs">{p.categoria}</td>
                  <td className="px-3 py-2 font-semibold text-accent">{formatearPrecio(p.precio)}</td>
                  <td className="px-3 py-2">
                    <span className={`font-semibold ${p.stock <= 0 ? 'text-dulce-red' : p.stock <= 3 ? 'text-dulce-yellow' : 'text-dulce-green'}`}>{p.stock}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleToggleActivo(p)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${p.activo ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(p)}
                        className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-1 text-xs font-medium text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(p.id)}
                        className="bg-bg-soft border border-primary-dark rounded-lg px-2 py-1 text-xs font-medium text-text-medium hover:bg-dulce-red hover:text-white hover:border-dulce-red transition-all">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-text-light">Sin productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-text-dark/50 z-[800] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-hover" style={{ animation: 'popIn 0.3s ease-out' }}>

            {/* ── CREAR: paso fotos ── */}
            {modal === 'crear' && paso === 'fotos' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-serif text-xl text-text-dark">Fotos del producto</h3>
                    <p className="text-xs text-text-medium mt-0.5">
                      Producto <strong>"{productoActual.nombre}"</strong> creado correctamente ✓
                    </p>
                  </div>
                  <button onClick={cerrarModal} className="text-text-light hover:text-text-dark text-2xl">✕</button>
                </div>

                <SeccionFotos />

                <div className="mt-6 pt-4 border-t border-primary-dark">
                  <button
                    onClick={cerrarModal}
                    className="w-full bg-accent text-white py-2.5 rounded-full font-bold hover:bg-accent-dark transition-all"
                  >
                    Listo — cerrar
                  </button>
                </div>
              </>
            ) : (
              /* ── CREAR: paso form  /  EDITAR ── */
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-serif text-xl text-text-dark">
                    {modal === 'crear' ? 'Nuevo producto' : 'Editar producto'}
                  </h3>
                  <button onClick={cerrarModal} className="text-text-light hover:text-text-dark text-2xl">✕</button>
                </div>

                <form onSubmit={handleGuardar} className="space-y-4">
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input className="form-input" placeholder="Nombre del producto"
                      value={productoActual.nombre ?? ''}
                      onChange={(e) => setProductoActual({ ...productoActual, nombre: e.target.value })}
                      required />
                  </div>
                  <div>
                    <label className="form-label">Descripción</label>
                    <textarea className="form-input resize-none h-20"
                      value={productoActual.descripcion ?? ''}
                      onChange={(e) => setProductoActual({ ...productoActual, descripcion: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Precio (COP) *</label>
                      <input type="number" className="form-input" min={0}
                        value={productoActual.precio ?? 0}
                        onChange={(e) => setProductoActual({ ...productoActual, precio: Number(e.target.value) })}
                        required />
                    </div>
                    <div>
                      <label className="form-label">Stock</label>
                      <input type="number" className="form-input" min={0}
                        value={productoActual.stock ?? 0}
                        onChange={(e) => setProductoActual({ ...productoActual, stock: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Categoría</label>
                    <select className="form-input"
                      value={productoActual.categoria ?? ''}
                      onChange={(e) => setProductoActual({ ...productoActual, categoria: e.target.value })}>
                      {categoriasDisponibles.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {error && <p className="text-dulce-red text-sm">{error}</p>}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={cerrarModal}
                      className="flex-1 border-2 border-primary-dark text-text-medium py-2.5 rounded-full font-bold hover:border-accent hover:text-accent transition-all">
                      Cancelar
                    </button>
                    <button type="submit" disabled={guardando}
                      className="flex-1 bg-accent text-white py-2.5 rounded-full font-bold hover:bg-accent-dark transition-all disabled:opacity-60">
                      {guardando
                        ? 'Guardando...'
                        : modal === 'crear'
                        ? 'Crear y agregar fotos →'
                        : 'Guardar cambios'}
                    </button>
                  </div>
                </form>

                {/* Fotos en modo editar */}
                {modal === 'editar' && productoActual.id && <SeccionFotos />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
