import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const ProductoSchema = z.object({
  nombre: z.string().min(2).max(150),
  descripcion: z.string().max(2000).optional().default(''),
  precio: z.number().min(0),
  stock: z.number().int().min(0).optional().default(0),
  categoria: z.string().min(2).max(80),
  imagenUrl: z.string().nullable().optional(),
  activo: z.boolean().optional().default(true),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({ orderBy: { fechaCreacion: 'desc' } })
  return NextResponse.json(productos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const v = ProductoSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

    const producto = await prisma.producto.create({ data: v.data })
    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
