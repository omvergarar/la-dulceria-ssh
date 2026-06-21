import { prisma } from '@/lib/prisma'
import OrdenesAdminClient from './OrdenesAdminClient'

export default async function AdminOrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado: estadoParam } = await searchParams
  const where = estadoParam
    ? { estado: estadoParam as any }
    : {}

  const ordenes = await prisma.orden.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, email: true, telefono: true } },
      detalles: { include: { producto: { select: { nombre: true } } } },
    },
    orderBy: { fecha: 'desc' },
  })

  return (
    <OrdenesAdminClient
      ordenesIniciales={ordenes.map((o) => ({
        id: o.id,
        clienteNombre: o.cliente.nombre,
        clienteEmail: o.cliente.email,
        clienteTelefono: o.cliente.telefono,
        total: Number(o.total),
        estado: o.estado,
        fecha: o.fecha.toISOString(),
        referenciaPago: o.referenciaPago,
        direccionEnvio: o.direccionEnvio,
        notas: o.notas,
        detalles: o.detalles.map((d) => ({
          productoNombre: d.producto.nombre,
          cantidad: d.cantidad,
          precioUnitario: Number(d.precioUnitario),
        })),
      }))}
      filtroEstado={estadoParam ?? ''}
    />
  )
}
