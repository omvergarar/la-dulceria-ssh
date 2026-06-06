import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

// PUT — aprobar o rechazar
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { aprobada } = await req.json()

  const resena = await prisma.resena.update({
    where: { id: Number(id) },
    data: { aprobada },
  })
  return NextResponse.json(resena)
}

// DELETE — eliminar definitivamente
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.resena.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
