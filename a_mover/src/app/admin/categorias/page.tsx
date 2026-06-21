import { prisma } from '@/lib/prisma'
import CategoriasAdminClient from './CategoriasAdminClient'

interface CategoriaRow {
  id: number
  nombre: string
  activo: number | boolean
  orden: number
  creado_en: Date | string
}

export default async function AdminCategoriasPage() {
  // Usamos queryRaw para ser robustos ante el singleton cacheado entre migraciones
  const rows = await prisma.$queryRaw<CategoriaRow[]>`
    SELECT id, nombre, activo, orden, creado_en FROM categorias ORDER BY orden ASC, nombre ASC
  `

  // Contar productos por categoría
  const conteoRows = await prisma.$queryRaw<{ categoria: string; total: bigint }[]>`
    SELECT categoria, COUNT(id) AS total FROM productos GROUP BY categoria
  `
  const mapaConteo = Object.fromEntries(
    conteoRows.map((r) => [r.categoria, Number(r.total)])
  )

  const data = rows.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    activo: Boolean(c.activo),
    orden: c.orden,
    creadoEn: new Date(c.creado_en).toISOString(),
    _count: { productos: mapaConteo[c.nombre] ?? 0 },
  }))

  return <CategoriasAdminClient categoriasIniciales={data} />
}
