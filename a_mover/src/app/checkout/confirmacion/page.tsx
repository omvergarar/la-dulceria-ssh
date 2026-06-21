import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatearPrecio, ESTADOS_ORDEN } from '@/lib/utils'

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; id?: string }>
}) {
  const { ref: referencia } = await searchParams

  if (!referencia) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-6xl block mb-4">❓</span>
          <h1 className="font-serif text-2xl text-text-dark mb-4">Referencia no encontrada</h1>
          <Link href="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const orden = await prisma.orden.findFirst({
    where: { referenciaPago: referencia },
    include: { detalles: { include: { producto: true } } },
  })

  if (!orden) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-6xl block mb-4">⏳</span>
          <h1 className="font-serif text-2xl text-text-dark mb-4">Procesando tu pago...</h1>
          <p className="text-text-medium mb-4">Esto puede tomar unos segundos. Te notificaremos por correo.</p>
          <Link href="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const estadoInfo = ESTADOS_ORDEN[orden.estado]
  const exitoso = orden.estado === 'pagado' || orden.estado === 'enviado'

  return (
    <div className="min-h-screen bg-bg-cream py-16 px-6">
      <div className="max-w-lg mx-auto text-center">
        <span className="text-7xl block mb-6">{exitoso ? '🎉' : '⏳'}</span>
        <h1 className="font-serif text-3xl text-text-dark mb-3">
          {exitoso ? '¡Pedido confirmado!' : 'Pedido en proceso'}
        </h1>
        <p className="text-text-medium mb-6">
          {exitoso
            ? 'Gracias por tu compra. Recibirás un correo con los detalles.'
            : 'Tu pedido fue registrado y está pendiente de confirmación de pago.'}
        </p>

        <div className="bg-primary text-accent-dark rounded-full px-6 py-2 font-bold text-lg inline-block mb-8">
          Orden #{orden.id}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-card mb-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-serif text-lg text-text-dark">Resumen</h2>
            <span className={estadoInfo.color + ' px-3 py-1 rounded-full text-xs font-bold'}>
              {estadoInfo.label}
            </span>
          </div>
          {orden.detalles.map((d) => (
            <div key={d.id} className="flex justify-between text-sm py-2 border-b border-primary-dark last:border-0">
              <span className="text-text-medium">{d.producto.nombre} × {d.cantidad}</span>
              <span className="font-semibold">{formatearPrecio(Number(d.precioUnitario) * d.cantidad)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg text-text-dark mt-4 pt-3 border-t border-primary-dark">
            <span>Total pagado</span>
            <span className="text-accent">{formatearPrecio(Number(orden.total))}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/cuenta" className="btn-primary">Ver mis pedidos</Link>
          <Link href="/catalogo" className="btn-outline">Seguir comprando</Link>
        </div>
      </div>
    </div>
  )
}
