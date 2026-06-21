import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const foto = await prisma.fotoCarrusel.update({
    where: { id: Number(id) },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
      ...(body.activo !== undefined && { activo: body.activo }),
      ...(body.orden !== undefined && { orden: body.orden }),
    },
  })
  return NextResponse.json(foto)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.fotoCarrusel.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
