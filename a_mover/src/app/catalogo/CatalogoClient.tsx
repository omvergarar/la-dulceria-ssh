'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
  imagenUrl: string | null
  descripcion: string
}

interface Categoria {
  nombre: string
  cantidad: number
}

interface Props {
  productos: Producto[]
  categorias: Categoria[]
  filtroActivo: string
  busqueda: string
  orden: string
}

const POR_PAGINA = 12

export default function CatalogoClient({ productos, categorias, filtroActivo, busqueda, orden }: Props) {
  const router = useRouter()
  const [pagina, setPagina] = useState(1)
  const [busquedaLocal, setBusquedaLocal] = useState(busqueda)

  const totalPaginas = Math.ceil(productos.length / POR_PAGINA)
  const productosPagina = productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  useEffect(() => { setPagina(1) }, [filtroActivo, busqueda, orden])

  function actualizarFiltros(params: Record<string, string>) {
    const sp = new URLSearchParams()
    if (params.categoria) sp.set('categoria', params.categoria)
    if (params.q) sp.set('q', params.q)
    if (params.orden) sp.set('orden', params.orden)
    router.push(`/catalogo?${sp.toString()}`)
  }

  function handleBusqueda(e: React.FormEvent) {
    e.preventDefault()
    actualizarFiltros({ categoria: filtroActivo, q: busquedaLocal, orden })
  }

  return (
    <div className="min-h-screen bg-bg-soft py-10 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="section-header mb-8">
          <h1 className="font-serif text-4xl text-text-dark mb-2">Nuestro Catálogo 🎀</h1>
          <p className="text-text-medium">Encuentra el regalo perfecto para cada ocasión</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar filtros */}
          <aside className="md:sticky md:top-20 h-fit">
            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-serif text-lg text-text-dark mb-4 pb-2 border-b-2 border-primary-dark">
                Filtrar por
              </h3>

              {/* Búsqueda */}
              <form onSubmit={handleBusqueda} className="relative mb-4">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="form-input pl-8"
                  value={busquedaLocal}
                  onChange={(e) => setBusquedaLocal(e.target.value)}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">🔍</span>
              </form>

              {/* Categorías */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => actualizarFiltros({ orden })}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${
                    !filtroActivo
                      ? 'bg-primary text-accent-dark'
                      : 'text-text-medium hover:bg-primary hover:text-accent-dark'
                  }`}
                >
                  <span>Todos</span>
                  <span className="bg-primary-dark text-accent-dark rounded-full px-2 py-0.5 text-xs font-bold">
                    {productos.length}
                  </span>
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.nombre}
                    onClick={() => actualizarFiltros({ categoria: cat.nombre, orden })}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${
                      filtroActivo === cat.nombre
                        ? 'bg-primary text-accent-dark'
                        : 'text-text-medium hover:bg-primary hover:text-accent-dark'
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span className="bg-primary-dark text-accent-dark rounded-full px-2 py-0.5 text-xs font-bold">
                      {cat.cantidad}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ordenamiento */}
              <div className="mt-6 pt-4 border-t border-primary-dark">
                <h4 className="font-semibold text-text-medium text-sm mb-2">Ordenar por</h4>
                <select
                  className="form-input text-sm"
                  value={orden}
                  onChange={(e) => actualizarFiltros({ categoria: filtroActivo, q: busqueda, orden: e.target.value })}
                >
                  <option value="">Más recientes</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Grid de productos */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm text-text-light">
                {productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}
              </span>
              {filtroActivo && (
                <button
                  onClick={() => actualizarFiltros({ orden })}
                  className="text-sm text-accent hover:underline"
                >
                  ✕ Quitar filtro
                </button>
              )}
            </div>

            {productosPagina.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="font-serif text-xl text-text-dark mb-2">Sin resultados</h3>
                <p className="text-text-medium">Intenta con otros términos o categorías</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {productosPagina.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex gap-2 justify-center mt-10 flex-wrap">
                <button
                  onClick={() => setPagina(pagina - 1)}
                  disabled={pagina === 1}
                  className="w-9 h-9 bg-white border-2 border-primary-dark rounded-lg font-bold text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`w-9 h-9 rounded-lg font-bold transition-all ${
                      n === pagina
                        ? 'bg-accent text-white border-2 border-accent'
                        : 'bg-white border-2 border-primary-dark text-text-medium hover:bg-accent hover:text-white hover:border-accent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPagina(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  className="w-9 h-9 bg-white border-2 border-primary-dark rounded-lg font-bold text-text-medium hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
