import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const fotos = await prisma.fotoCarrusel.findMany({ orderBy: { orden: 'asc' } })
  return NextResponse.json(fotos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const total = await prisma.fotoCarrusel.count()
  const foto = await prisma.fotoCarrusel.create({
    data: { url: body.url, titulo: body.titulo ?? null, descripcion: body.descripcion ?? null, orden: total },
  })
  return NextResponse.json(foto, { status: 201 })
}
