import { prisma } from '@/lib/prisma'

interface FilaCat {
  categoria: string
  total: number
  enStock: number
  ultimas: number
  agotados: number
  inactivos: number
}

export default async function EstadisticasPage() {
  const productos = await prisma.producto.findMany({
    select: { categoria: true, stock: true, activo: true },
  })

  const total = productos.length
  const activos = productos.filter((p) => p.activo)
  const enStock = activos.filter((p) => p.stock > 3).length
  const ultimas = activos.filter((p) => p.stock > 0 && p.stock <= 3).length
  const agotados = activos.filter((p) => p.stock === 0).length
  const inactivos = productos.filter((p) => !p.activo).length

  const cats = [...new Set(productos.map((p) => p.categoria).filter(Boolean))]
  const filas: FilaCat[] = cats.map((cat) => {
    const prods = productos.filter((p) => p.categoria === cat)
    return {
      categoria: cat,
      total: prods.length,
      enStock: prods.filter((p) => p.activo && p.stock > 3).length,
      ultimas: prods.filter((p) => p.activo && p.stock > 0 && p.stock <= 3).length,
      agotados: prods.filter((p) => p.activo && p.stock === 0).length,
      inactivos: prods.filter((p) => !p.activo).length,
    }
  }).sort((a, b) => b.total - a.total)

  const miniStats = [
    { label: 'Total', n: total, color: 'text-accent', border: 'border-accent' },
    { label: 'En stock', n: enStock, color: 'text-green-600', border: 'border-green-400' },
    { label: 'Últimas unidades', n: ultimas, color: 'text-yellow-600', border: 'border-yellow-400' },
    { label: 'Agotados', n: agotados, color: 'text-red-500', border: 'border-red-400' },
    { label: 'Inactivos', n: inactivos, color: 'text-gray-400', border: 'border-gray-300' },
  ]

  return (
    <div>
      <h2 className="font-serif text-2xl text-text-dark mb-6">Estadísticas</h2>

      {/* Mini stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        {miniStats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl shadow-card px-5 py-4 flex flex-col items-center min-w-[100px] border-t-4 ${s.border}`}>
            <span className={`text-3xl font-bold ${s.color}`}>{s.n}</span>
            <span className="text-xs text-text-light mt-1 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabla por categoría */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-primary-dark">
          <h3 className="font-serif text-lg text-text-dark">Productos por categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-4 py-3 font-bold">Categoría</th>
                <th className="px-4 py-3 font-bold text-center">Total</th>
                <th className="px-4 py-3 font-bold text-center">En stock</th>
                <th className="px-4 py-3 font-bold text-center">Últimas</th>
                <th className="px-4 py-3 font-bold text-center">Agotados</th>
                <th className="px-4 py-3 font-bold text-center">Inactivos</th>
                <th className="px-4 py-3 font-bold">Distribución</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const pct = (n: number) => (f.total > 0 ? Math.round((n / f.total) * 100) : 0)
                return (
                  <tr key={f.categoria} className="border-b border-primary-dark hover:bg-bg-soft">
                    <td className="px-4 py-3 font-medium text-text-dark">{f.categoria}</td>
                    <td className="px-4 py-3 text-center font-bold text-accent">{f.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[28px] bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {f.enStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[28px] bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {f.ultimas}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[28px] bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {f.agotados}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[28px] bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                        {f.inactivos}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                        {pct(f.enStock) > 0 && (
                          <div className="bg-green-400 h-full" style={{ width: `${pct(f.enStock)}%` }} title={`En stock: ${f.enStock}`} />
                        )}
                        {pct(f.ultimas) > 0 && (
                          <div className="bg-yellow-400 h-full" style={{ width: `${pct(f.ultimas)}%` }} title={`Últimas: ${f.ultimas}`} />
                        )}
                        {pct(f.agotados) > 0 && (
                          <div className="bg-red-400 h-full" style={{ width: `${pct(f.agotados)}%` }} title={`Agotados: ${f.agotados}`} />
                        )}
                        {pct(f.inactivos) > 0 && (
                          <div className="bg-gray-300 h-full" style={{ width: `${pct(f.inactivos)}%` }} title={`Inactivos: ${f.inactivos}`} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-text-light">Sin productos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-primary-dark text-xs text-text-light">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> En stock (&gt;3)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Últimas unidades (1-3)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Agotados (0)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Inactivos</span>
        </div>
      </div>
    </div>
  )
}
