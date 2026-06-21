import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const CategoriaSchema = z.object({
  nombre: z.string().min(2).max(80),
  orden: z.number().int().min(0).optional(),
})

export async function GET() {
  const rows = await prisma.$queryRaw<{ id: number; nombre: string; activo: number; orden: number; creado_en: Date }[]>`
    SELECT id, nombre, activo, orden, creado_en FROM categorias ORDER BY orden ASC, nombre ASC
  `
  return NextResponse.json(rows.map((r) => ({ ...r, activo: Boolean(r.activo) })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = CategoriaSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { nombre, orden = 0 } = parsed.data

    const existing = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM categorias WHERE nombre = ${nombre} LIMIT 1
    `
    if (existing.length > 0) return NextResponse.json({ error: 'Ya existe una categoría con ese nombre.' }, { status: 409 })

    await prisma.$executeRaw`
      INSERT INTO categorias (nombre, activo, orden, creado_en) VALUES (${nombre}, 1, ${orden}, NOW())
    `
    const [cat] = await prisma.$queryRaw<{ id: number; nombre: string; activo: number; orden: number; creado_en: Date }[]>`
      SELECT id, nombre, activo, orden, creado_en FROM categorias WHERE nombre = ${nombre} LIMIT 1
    `
    return NextResponse.json({ ...cat, activo: Boolean(cat.activo) }, { status: 201 })
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
