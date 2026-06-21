import { prisma } from '@/lib/prisma'
import ClientesAdminClient from './ClientesAdminClient'

export default async function AdminClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { fechaRegistro: 'desc' },
    include: { _count: { select: { ordenes: true } } },
  })

  const data = clientes.map((c) => ({
    ...c,
    fechaRegistro: c.fechaRegistro.toISOString(),
  }))

  return <ClientesAdminClient clientesIniciales={data} />
}
