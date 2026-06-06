import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const body = await req.json()
    const { nombre, descripcion, precio, stock, categoria, imagenUrl, activo } = body

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio }),
        ...(stock !== undefined && { stock }),
        ...(categoria && { categoria }),
        ...(imagenUrl !== undefined && { imagenUrl }),
        ...(activo !== undefined && { activo }),
      },
    })
    return NextResponse.json(producto)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: idParam } = await params
  const id = Number(idParam)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    await prisma.producto.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
