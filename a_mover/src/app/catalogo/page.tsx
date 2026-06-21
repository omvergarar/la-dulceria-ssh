import { prisma } from '@/lib/prisma'
import CatalogoClient from './CatalogoClient'

export const metadata = {
  title: 'Catálogo — La Dulcería tienda de regalos',
  description: 'Explora todos nuestros regalos: cajas de regalo, desayunos sorpresa, velas y mucho más.',
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; orden?: string }>
}) {
  const { categoria, q, orden } = await searchParams

  const where = {
    activo: true,
    ...(categoria ? { categoria } : {}),
    ...(q ? { nombre: { contains: q } } : {}),
  }

  const orderBy =
    orden === 'precio_asc'
      ? { precio: 'asc' as const }
      : orden === 'precio_desc'
      ? { precio: 'desc' as const }
      : { fechaCreacion: 'desc' as const }

  // Categorías activas de la tabla categorias + conteo de productos por cada una
  const [productos, categoriasActivas, conteoRows] = await Promise.all([
    prisma.producto.findMany({ where, orderBy }),
    prisma.$queryRaw<{ nombre: string }[]>`
      SELECT nombre FROM categorias WHERE activo = 1 ORDER BY orden ASC, nombre ASC
    `,
    prisma.producto.groupBy({
      by: ['categoria'],
      where: { activo: true },
      _count: { id: true },
    }),
  ])

  const mapaConteo = Object.fromEntries(conteoRows.map((r) => [r.categoria, r._count.id]))

  const categorias = categoriasActivas.map((c) => ({
    nombre: c.nombre,
    cantidad: mapaConteo[c.nombre] ?? 0,
  }))

  return (
    <CatalogoClient
      productos={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        stock: p.stock,
        categoria: p.categoria,
        imagenUrl: p.imagenUrl,
        descripcion: p.descripcion,
      }))}
      categorias={categorias}
      filtroActivo={categoria ?? ''}
      busqueda={q ?? ''}
      orden={orden ?? ''}
    />
  )
}
