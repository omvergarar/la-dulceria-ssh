import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const q = searchParams.get('q')
  const orden = searchParams.get('orden')

  const where = {
    activo: true,
    ...(categoria ? { categoria } : {}),
    ...(q ? { nombre: { contains: q } } : {}),
  }

  const orderBy =
    orden === 'precio_asc'
      ? { precio: 'asc' as const }
      : orden === 'precio_desc'
      ? { precio: 'desc' as const }
      : { fechaCreacion: 'desc' as const }

  const productos = await prisma.producto.findMany({ where, orderBy })
  return NextResponse.json(productos)
}
