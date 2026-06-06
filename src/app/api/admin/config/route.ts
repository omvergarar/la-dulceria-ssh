import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const config = await prisma.configTienda.findUnique({ where: { id: 1 } })
  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { bannerActivo, codigoPromo, descuentoPorcentaje, envioGratisDesde } = await req.json()

  const config = await prisma.configTienda.upsert({
    where: { id: 1 },
    update: {
      ...(bannerActivo !== undefined && { bannerActivo }),
      ...(codigoPromo && { codigoPromo: codigoPromo.toUpperCase().trim() }),
      ...(descuentoPorcentaje !== undefined && { descuentoPorcentaje: Number(descuentoPorcentaje) }),
      ...(envioGratisDesde !== undefined && { envioGratisDesde: Number(envioGratisDesde) }),
    },
    create: {
      id: 1,
      bannerActivo: bannerActivo ?? true,
      codigoPromo: codigoPromo ?? 'DULCE15',
      descuentoPorcentaje: descuentoPorcentaje ?? 15,
      envioGratisDesde: envioGratisDesde ?? 120000,
    },
  })
  return NextResponse.json(config)
}
