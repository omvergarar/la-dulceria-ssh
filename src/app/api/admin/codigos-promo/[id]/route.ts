import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  const { activo } = await req.json()

  const codigo = await prisma.codigoPromo.update({ where: { id }, data: { activo } })
  return NextResponse.json(codigo)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idParam } = await params
  await prisma.codigoPromo.delete({ where: { id: Number(idParam) } })
  return NextResponse.json({ ok: true })
}
