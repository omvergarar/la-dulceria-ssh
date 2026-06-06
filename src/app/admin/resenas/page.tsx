import { prisma } from '@/lib/prisma'
import ResenasAdminClient from './ResenasAdminClient'

export const metadata = { title: 'Reseñas — Admin La Dulcería tienda de regalos' }

export default async function AdminResenasPage() {
  const resenas = await prisma.resena.findMany({ orderBy: { creadoEn: 'desc' } })

  return (
    <ResenasAdminClient
      resenasIniciales={resenas.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        ciudad: r.ciudad,
        texto: r.texto,
        estrellas: r.estrellas,
        aprobada: r.aprobada,
        creadoEn: r.creadoEn.toISOString(),
      }))}
    />
  )
}
