import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const RegistroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo inválido'),
  telefono: z.string().max(20).optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validacion = RegistroSchema.safeParse(body)

    if (!validacion.success) {
      return NextResponse.json(
        { error: validacion.error.errors[0].message },
        { status: 400 }
      )
    }

    const { nombre, email, telefono, password } = validacion.data

    // Verificar si el correo ya existe
    const existente = await prisma.cliente.findUnique({ where: { email } })
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este correo electrónico.' },
        { status: 409 }
      )
    }

    // Hashear contraseña con bcrypt (costo 12)
    const contrasena = await bcrypt.hash(password, 12)

    const cliente = await prisma.cliente.create({
      data: { nombre, email, contrasena, telefono: telefono ?? null },
      select: { id: true, nombre: true, email: true },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
