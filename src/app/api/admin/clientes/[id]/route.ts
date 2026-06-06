import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const EditSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  telefono: z.string().max(20).optional().nullable(),
  direccion: z.string().max(300).optional().nullable(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
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

    const { password, ...rest } = parsed.data

    if (rest.email) {
      const existente = await prisma.cliente.findFirst({ where: { email: rest.email, NOT: { id } } })
      if (existente) return NextResponse.json({ error: 'Ese correo ya está en uso.' }, { status: 409 })
    }

    const updateData: any = { ...rest }
    if (password) {
      updateData.contrasena = await bcrypt.hash(password, 12)
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { ordenes: true } } },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
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
    const ordenes = await prisma.orden.count({ where: { clienteId: id } })
    if (ordenes > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: el cliente tiene ${ordenes} orden(es) asociada(s).` },
        { status: 409 }
      )
    }

    await prisma.codigoUsado.deleteMany({ where: { clienteId: id } })
    await prisma.cliente.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
