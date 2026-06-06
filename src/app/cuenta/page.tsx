import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatearPrecio, formatearFecha, ESTADOS_ORDEN } from '@/lib/utils'
import Link from 'next/link'

export const metadata = {
  title: 'Mi cuenta — La Dulcería tienda de regalos',
}

export default async function CuentaPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/cuenta')

  // El admin no tiene cuenta de cliente — redirigir al panel
  if ((session.user as any)?.role === 'admin') redirect('/admin')

  const clienteId = Number((session.user as any).id)

  const ordenes = await prisma.orden.findMany({
    where: { clienteId },
    include: { detalles: { include: { producto: true } } },
    orderBy: { fecha: 'desc' },
  })

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true, email: true, telefono: true, direccion: true, fechaRegistro: true },
  })

  return (
    <div className="min-h-screen bg-bg-cream py-10 px-6">
      <div className="max-w-[1280px] mx-auto">
        <h1 className="font-serif text-3xl text-text-dark mb-2">Mi cuenta</h1>
        <p className="text-text-medium mb-10">Bienvenida, <strong>{session.user?.name}</strong> 🌸</p>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          {/* Perfil */}
          <aside className="bg-white rounded-xl p-6 shadow-card h-fit">
            <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-serif text-2xl font-bold mb-4">
              {session.user?.name?.[0] ?? '?'}
            </div>
            <h2 className="font-serif text-lg text-text-dark mb-1">{cliente?.nombre}</h2>
            <p className="text-sm text-text-medium mb-4">{cliente?.email}</p>

            {cliente?.telefono && (
              <p className="text-sm text-text-light mb-1">📞 {cliente.telefono}</p>
            )}
            {cliente?.direccion && (
              <p className="text-sm text-text-light mb-4">📍 {cliente.direccion}</p>
            )}
            <p className="text-xs text-text-light">
              Cliente desde {formatearFecha(cliente?.fechaRegistro ?? new Date())}
            </p>

            <div className="border-t border-primary-dark mt-6 pt-4 space-y-2">
              <Link href="/catalogo" className="block text-sm text-accent hover:underline">
                🎀 Ver catálogo
              </Link>
              <Link href="/carrito" className="block text-sm text-accent hover:underline">
                🛒 Ver carrito
              </Link>
            </div>
          </aside>

          {/* Órdenes */}
          <div>
            <h2 className="font-serif text-2xl text-text-dark mb-6">
              Mis pedidos ({ordenes.length})
            </h2>

            {ordenes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-card text-center">
                <span className="text-5xl block mb-4">📦</span>
                <h3 className="font-serif text-xl text-text-dark mb-2">Sin pedidos todavía</h3>
                <p className="text-text-medium mb-6">¡Explora nuestro catálogo y haz tu primer pedido!</p>
                <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {ordenes.map((orden) => {
                  const estadoInfo = ESTADOS_ORDEN[orden.estado]
                  return (
                    <div key={orden.id} className="bg-white rounded-xl p-6 shadow-card">
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div>
                          <h3 className="font-serif text-lg text-text-dark">
                            Pedido #{orden.id}
                          </h3>
                          <p className="text-xs text-text-light mt-0.5">
                            {formatearFecha(orden.fecha)}
                            {orden.referenciaPago && (
                              <span className="ml-2 font-mono">· Ref: {orden.referenciaPago}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`${estadoInfo.color} px-3 py-1 rounded-full text-xs font-bold`}>
                            {estadoInfo.label}
                          </span>
                          <span className="font-bold text-accent text-lg">
                            {formatearPrecio(Number(orden.total))}
                          </span>
                        </div>
                      </div>

                      {/* Productos */}
                      <div className="space-y-2">
                        {orden.detalles.map((d) => (
                          <div key={d.id} className="flex justify-between text-sm py-2 border-b border-primary-dark last:border-0">
                            <div>
                              <span className="font-medium text-text-dark">{d.producto.nombre}</span>
                              <span className="text-text-light ml-2">× {d.cantidad}</span>
                            </div>
                            <span className="text-text-medium">
                              {formatearPrecio(Number(d.precioUnitario) * d.cantidad)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
