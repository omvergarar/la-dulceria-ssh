import { prisma } from '@/lib/prisma'
import CarruselAdminClient from './CarruselAdminClient'

export const metadata = { title: 'Carrusel — Admin La Dulcería' }

export default async function AdminCarruselPage() {
  const fotos = await prisma.fotoCarrusel.findMany({ orderBy: { orden: 'asc' } })

  return (
    <CarruselAdminClient
      fotosIniciales={fotos.map((f) => ({
        id: f.id,
        url: f.url,
        titulo: f.titulo,
        descripcion: f.descripcion,
        orden: f.orden,
        activo: f.activo,
      }))}
    />
  )
}
