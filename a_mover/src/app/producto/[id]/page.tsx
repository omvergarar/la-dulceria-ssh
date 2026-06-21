import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductoClient from './ProductoClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producto = await prisma.producto.findUnique({ where: { id: Number(id) } })
  if (!producto) return { title: 'Producto no encontrado — La Dulcería tienda de regalos' }
  return {
    title: `${producto.nombre} — La Dulcería tienda de regalos`,
    description: producto.descripcion.slice(0, 160),
  }
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  if (isNaN(id)) notFound()

  const producto = await prisma.producto.findUnique({ where: { id, activo: true } })
  if (!producto) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fotos = await (prisma as any).fotoProducto.findMany({
    where: { productoId: id },
    orderBy: { orden: 'asc' },
  }) as { id: number; url: string; orden: number }[]

  const relacionados = await prisma.producto.findMany({
    where: { categoria: producto.categoria, activo: true, id: { not: producto.id } },
    take: 4,
  })

  return (
    <ProductoClient
      producto={{
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        stock: producto.stock,
        categoria: producto.categoria,
        imagenUrl: producto.imagenUrl,
        fotos,
      }}
      relacionados={relacionados.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        stock: p.stock,
        categoria: p.categoria,
        imagenUrl: p.imagenUrl,
        descripcion: p.descripcion,
      }))}
    />
  )
}
