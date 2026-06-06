import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Webhook de Wompi — confirma pagos automáticamente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, data } = body

    // Solo procesar eventos de transacciones
    if (event !== 'transaction.updated') {
      return NextResponse.json({ ok: true })
    }

    const transaccion = data?.transaction
    if (!transaccion) {
      return NextResponse.json({ error: 'Sin datos de transacción' }, { status: 400 })
    }

    const referencia = transaccion.reference
    const estadoWompi = transaccion.status // APPROVED, DECLINED, VOIDED, ERROR

    // Mapear estados de Wompi a nuestros estados
    const estadoOrden =
      estadoWompi === 'APPROVED'
        ? 'pagado'
        : estadoWompi === 'DECLINED' || estadoWompi === 'VOIDED' || estadoWompi === 'ERROR'
        ? 'cancelado'
        : null

    if (!estadoOrden) {
      return NextResponse.json({ ok: true, message: 'Estado ignorado' })
    }

    // Actualizar orden en BD
    const orden = await prisma.orden.findFirst({ where: { referenciaPago: referencia } })
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    await prisma.orden.update({
      where: { id: orden.id },
      data: { estado: estadoOrden as any },
    })

    // Si el pago fue rechazado, restaurar stock
    if (estadoOrden === 'cancelado') {
      const detalles = await prisma.detalleOrden.findMany({ where: { ordenId: orden.id } })
      for (const d of detalles) {
        await prisma.producto.update({
          where: { id: d.productoId },
          data: { stock: { increment: d.cantidad } },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error en webhook Wompi:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
