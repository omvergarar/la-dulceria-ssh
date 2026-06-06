import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Valida si un código es aplicable para el cliente actual
export async function POST(req: NextRequest) {
  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const codigoUpper = codigo.toUpperCase().trim()

  // Buscar el código en la tabla de codigos_promo
  const promoCodigo = await prisma.codigoPromo.findUnique({
    where: { codigo: codigoUpper },
  })

  if (!promoCodigo || !promoCodigo.activo) {
    return NextResponse.json({ error: 'Código inválido o inactivo' }, { status: 400 })
  }

  // Si hay sesión, verificar que no lo haya usado ya
  const session = await getServerSession(authOptions)
  if (session && (session.user as any)?.role === 'cliente') {
    const clienteId = Number((session.user as any).id)
    const yaUsado = await prisma.codigoUsado.findUnique({
      where: { clienteId_codigo: { clienteId, codigo: codigoUpper } },
    })
    if (yaUsado) {
      return NextResponse.json({ error: 'Este código ya fue utilizado por tu cuenta' }, { status: 400 })
    }
  }

  return NextResponse.json({ descuento: promoCodigo.descuento, codigo: codigoUpper })
}
