import { prisma } from '@/lib/prisma'
import ProductosAdminClient from './ProductosAdminClient'

export default async function AdminProductosPage() {
  const productos = await prisma.producto.findMany({ orderBy: { fechaCreacion: 'desc' } })

  // Usamos queryRaw para ser robustos ante el singleton cacheado entre migraciones
  let categoriasDisponibles: string[] = []
  try {
    const rows = await prisma.$queryRaw<{ nombre: string }[]>`
      SELECT nombre FROM categorias WHERE activo = 1 ORDER BY orden ASC, nombre ASC
    `
    categoriasDisponibles = rows.map((r) => r.nombre)
  } catch {
    // Fallback: categorías únicas en productos existentes
    categoriasDisponibles = [...new Set(productos.map((p) => p.categoria).filter(Boolean))]
  }

  return (
    <ProductosAdminClient
      productosIniciales={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        stock: p.stock,
        categoria: p.categoria,
        imagenUrl: p.imagenUrl,
        activo: p.activo,
      }))}
      categoriasDisponibles={categoriasDisponibles}
    />
  )
}
