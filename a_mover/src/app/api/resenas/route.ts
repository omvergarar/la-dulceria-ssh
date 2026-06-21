import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ResenaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  ciudad: z.string().max(100).optional(),
  texto: z.string().min(10, 'El comentario debe tener al menos 10 caracteres').max(2000),
  estrellas: z.number().int().min(1).max(5),
})

// GET — reseñas aprobadas (para la landing)
export async function GET() {
  const resenas = await prisma.resena.findMany({
    where: { aprobada: true },
    orderBy: { creadoEn: 'desc' },
    take: 20,
  })
  return NextResponse.json(resenas)
}

// POST — enviar nueva reseña (queda pendiente de aprobación)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const v = ResenaSchema.safeParse(body)
    if (!v.success) {
      return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
    }
    const resena = await prisma.resena.create({
      data: { ...v.data, aprobada: false },
    })
    return NextResponse.json(resena, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al guardar la reseña' }, { status: 500 })
  }
}
