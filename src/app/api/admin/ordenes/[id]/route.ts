import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const ESTADOS_VALIDOS = ['pendiente', 'pagado', 'enviado', 'cancelado']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const { estado } = await req.json()
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const orden = await prisma.orden.update({
      where: { id },
      data: { estado: estado as any },
    })
    return NextResponse.json(orden)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 })
  }
}
