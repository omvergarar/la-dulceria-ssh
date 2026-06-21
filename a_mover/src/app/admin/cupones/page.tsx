import { prisma } from '@/lib/prisma'
import CuponesAdminClient from './CuponesAdminClient'

export default async function AdminCuponesPage() {
  const [codigos, usos] = await Promise.all([
    prisma.codigoPromo.findMany({ orderBy: { creadoEn: 'desc' } }),
    prisma.codigoUsado.findMany({
      include: { cliente: { select: { id: true, nombre: true, email: true } } },
      orderBy: { usadoEn: 'desc' },
    }),
  ])

  // Enriquecer usos con datos de la orden correspondiente
  const ordenes = await prisma.orden.findMany({
    where: { codigoPromo: { not: null } },
    select: { id: true, clienteId: true, codigoPromo: true, descuentoAplicado: true, total: true },
  })
  const mapaOrdenes = Object.fromEntries(
    ordenes.map((o) => [`${o.clienteId}-${o.codigoPromo}`, o])
  )

  // Conteo de usos por código
  const conteoUsos = Object.fromEntries(
    codigos.map((c) => [c.codigo, usos.filter((u) => u.codigo === c.codigo).length])
  )

  return (
    <CuponesAdminClient
      codigos={codigos.map((c) => ({
        ...c,
        creadoEn: c.creadoEn.toISOString(),
        usos: conteoUsos[c.codigo] ?? 0,
      }))}
      usos={usos.map((u) => {
        const orden = mapaOrdenes[`${u.clienteId}-${u.codigo}`]
        return {
          id: u.id,
          codigo: u.codigo,
          clienteId: u.clienteId,
          clienteNombre: u.cliente.nombre,
          clienteEmail: u.cliente.email,
          usadoEn: u.usadoEn.toISOString(),
          ordenId: orden?.id ?? null,
          descuentoAplicado: orden?.descuentoAplicado ? Number(orden.descuentoAplicado) : null,
          totalOrden: orden?.total ? Number(orden.total) : null,
        }
      })}
    />
  )
}
