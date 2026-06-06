import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Todos los códigos promo con su conteo de usos
  const codigos = await prisma.codigoPromo.findMany({
    orderBy: { creadoEn: 'desc' },
  })

  const usos = await prisma.codigoUsado.findMany({
    include: {
      cliente: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { usadoEn: 'desc' },
  })

  // Enriquecer con datos de la orden donde se usó el código
  const ordenes = await prisma.orden.findMany({
    where: { codigoPromo: { not: null } },
    select: {
      id: true,
      clienteId: true,
      codigoPromo: true,
      descuentoAplicado: true,
      total: true,
      fecha: true,
    },
  })

  // Mapa: "clienteId-codigo" → orden
  const mapaOrdenes = Object.fromEntries(
    ordenes.map((o) => [`${o.clienteId}-${o.codigoPromo}`, o])
  )

  const usoDetallado = usos.map((u) => {
    const orden = mapaOrdenes[`${u.clienteId}-${u.codigo}`]
    return {
      id: u.id,
      codigo: u.codigo,
      clienteId: u.clienteId,
      clienteNombre: u.cliente.nombre,
      clienteEmail: u.cliente.email,
      usadoEn: u.usadoEn,
      ordenId: orden?.id ?? null,
      descuentoAplicado: orden?.descuentoAplicado ? Number(orden.descuentoAplicado) : null,
      totalOrden: orden?.total ? Number(orden.total) : null,
    }
  })

  const codigosConUso = codigos.map((c) => ({
    ...c,
    usos: usos.filter((u) => u.codigo === c.codigo).length,
  }))

  return NextResponse.json({ codigos: codigosConUso, usos: usoDetallado })
}
