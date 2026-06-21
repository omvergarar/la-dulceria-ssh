import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const ClienteSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().max(20).optional().nullable(),
  direccion: z.string().max(300).optional().nullable(),
  password: z.string().min(8).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientes = await prisma.cliente.findMany({
    orderBy: { fechaRegistro: 'desc' },
    include: { _count: { select: { ordenes: true } } },
  })

  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = ClienteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { nombre, email, telefono, direccion, password } = parsed.data

    const existente = await prisma.cliente.findUnique({ where: { email } })
    if (existente) return NextResponse.json({ error: 'Ya existe un cliente con ese correo.' }, { status: 409 })

    const contrasena = await bcrypt.hash(password ?? 'Dulceria2024!', 12)

    const cliente = await prisma.cliente.create({
      data: { nombre, email, contrasena, telefono: telefono ?? null, direccion: direccion ?? null },
      include: { _count: { select: { ordenes: true } } },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
