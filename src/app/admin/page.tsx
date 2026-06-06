import { prisma } from '@/lib/prisma'
import { formatearPrecio } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [totalProductos, totalClientes, totalOrdenes, ordenesPendientes, ingresos] =
    await Promise.all([
      prisma.producto.count({ where: { activo: true } }),
      prisma.cliente.count(),
      prisma.orden.count(),
      prisma.orden.count({ where: { estado: 'pendiente' } }),
      prisma.orden.aggregate({
        where: { estado: { in: ['pagado', 'enviado'] } },
        _sum: { total: true },
      }),
    ])

  const ultimasOrdenes = await prisma.orden.findMany({
    take: 5,
    orderBy: { fecha: 'desc' },
    include: { cliente: { select: { nombre: true } } },
  })

  const stats = [
    { label: 'Productos activos', num: totalProductos, icon: '🎁', href: '/admin/productos' },
    { label: 'Clientes', num: totalClientes, icon: '👥', href: '/admin/clientes' },
    { label: 'Órdenes totales', num: totalOrdenes, icon: '📦', href: '/admin/ordenes' },
    { label: 'Ingresos confirmados', num: formatearPrecio(Number(ingresos._sum.total ?? 0)), icon: '💰', href: '/admin/ordenes' },
  ]

  return (
    <div>
      <h2 className="font-serif text-2xl text-text-dark mb-6">Dashboard</h2>

      {/* Mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-xl p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all border-t-4 border-accent"
          >
            <span className="text-3xl block mb-1">{s.icon}</span>
            <span className="font-serif text-2xl font-bold text-accent block">{s.num}</span>
            <span className="text-xs text-text-light font-semibold">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Alertas */}
      {ordenesPendientes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <strong className="text-yellow-800">
              {ordenesPendientes} orden{ordenesPendientes !== 1 ? 'es' : ''} pendiente{ordenesPendientes !== 1 ? 's' : ''}
            </strong>
            <p className="text-yellow-700 text-sm">Requieren atención</p>
          </div>
          <Link href="/admin/ordenes?estado=pendiente" className="ml-auto text-sm font-bold text-yellow-800 hover:underline">
            Ver →
          </Link>
        </div>
      )}

      {/* Últimas órdenes */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-text-dark">Últimas órdenes</h3>
          <Link href="/admin/ordenes" className="text-sm text-accent hover:underline">Ver todas →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-text-dark text-left">
                <th className="px-3 py-2 font-bold rounded-tl-lg">ID</th>
                <th className="px-3 py-2 font-bold">Cliente</th>
                <th className="px-3 py-2 font-bold">Total</th>
                <th className="px-3 py-2 font-bold rounded-tr-lg">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimasOrdenes.map((o) => (
                <tr key={o.id} className="border-b border-primary-dark hover:bg-bg-soft">
                  <td className="px-3 py-2.5 font-mono">#{o.id}</td>
                  <td className="px-3 py-2.5">{o.cliente.nombre}</td>
                  <td className="px-3 py-2.5 font-semibold text-accent">{formatearPrecio(Number(o.total))}</td>
                  <td className="px-3 py-2.5">
                    <span className={`badge-estado-${o.estado}`}>
                      {o.estado.charAt(0).toUpperCase() + o.estado.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {ultimasOrdenes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-text-light">
                    Sin órdenes todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
