import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const EditSchema = z.object({
  nombre: z.string().min(2).max(80).optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const body = await req.json()
    const parsed = EditSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { nombre, activo, orden } = parsed.data

    const [actual] = await prisma.$queryRaw<{ id: number; nombre: string; activo: number; orden: number }[]>`
      SELECT id, nombre, activo, orden FROM categorias WHERE id = ${id} LIMIT 1
    `
    if (!actual) return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 })

    if (nombre && nombre !== actual.nombre) {
      const dup = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM categorias WHERE nombre = ${nombre} AND id <> ${id} LIMIT 1
      `
      if (dup.length > 0) return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 })

      // Actualizar el nombre en todos los productos que usen esta categoría
      await prisma.$executeRaw`
        UPDATE productos SET categoria = ${nombre} WHERE categoria = ${actual.nombre}
      `
    }

    const nuevoNombre = nombre ?? actual.nombre
    const nuevoActivo = activo !== undefined ? (activo ? 1 : 0) : actual.activo
    const nuevoOrden = orden !== undefined ? orden : actual.orden

    await prisma.$executeRaw`
      UPDATE categorias SET nombre = ${nuevoNombre}, activo = ${nuevoActivo}, orden = ${nuevoOrden} WHERE id = ${id}
    `

    const [updated] = await prisma.$queryRaw<{ id: number; nombre: string; activo: number; orden: number; creado_en: Date }[]>`
      SELECT id, nombre, activo, orden, creado_en FROM categorias WHERE id = ${id} LIMIT 1
    `
    return NextResponse.json({ ...updated, activo: Boolean(updated.activo) })
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const [cat] = await prisma.$queryRaw<{ id: number; nombre: string }[]>`
      SELECT id, nombre FROM categorias WHERE id = ${id} LIMIT 1
    `
    if (!cat) return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 404 })

    const [{ total }] = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) AS total FROM productos WHERE categoria = ${cat.nombre}
    `
    if (Number(total) > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${Number(total)} producto(s) usan esta categoría.` },
        { status: 409 }
      )
    }

    await prisma.$executeRaw`DELETE FROM categorias WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
