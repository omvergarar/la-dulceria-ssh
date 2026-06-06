import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const codigos = await prisma.codigoPromo.findMany({ orderBy: { creadoEn: 'desc' } })
  return NextResponse.json(codigos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { codigo, descuento, descripcion } = await req.json()
  if (!codigo || !descuento) return NextResponse.json({ error: 'Código y descuento requeridos' }, { status: 400 })

  try {
    const nuevo = await prisma.codigoPromo.create({
      data: {
        codigo: codigo.toUpperCase().trim(),
        descuento: Number(descuento),
        descripcion: descripcion || null,
      },
    })
    return NextResponse.json(nuevo, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'El código ya existe' }, { status: 409 })
  }
}
