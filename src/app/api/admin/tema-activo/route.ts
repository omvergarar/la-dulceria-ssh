import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const tema = await prisma.temaActivo.findUnique({ where: { id: 1 } })
  return NextResponse.json(tema)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { nombre, primary, primaryDark, primaryDeeper, accent, accentDark, textDark } = body

  const tema = await prisma.temaActivo.upsert({
    where: { id: 1 },
    update: { nombre, primary, primaryDark, primaryDeeper, accent, accentDark, textDark },
    create: { id: 1, nombre, primary, primaryDark, primaryDeeper, accent, accentDark, textDark },
  })
  return NextResponse.json(tema)
}
