import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    orderBy: { fechaRegistro: 'desc' },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      direccion: true,
      activo: true,
      fechaRegistro: true,
      _count: { select: { ordenes: true } },
    },
  })

  const csv = [
    'ID,Nombre,Email,Teléfono,Dirección,Activo,Fecha Registro,Pedidos',
    ...clientes.map((c) =>
      [
        c.id,
        `"${c.nombre}"`,
        c.email,
        c.telefono ?? '',
        `"${c.direccion ?? ''}"`,
        c.activo ? 'Sí' : 'No',
        new Date(c.fechaRegistro).toLocaleDateString('es-CO'),
        c._count.ordenes,
      ].join(',')
    ),
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clientes-la-dulceria.csv"',
    },
  })
}
