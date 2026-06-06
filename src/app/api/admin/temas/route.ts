import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const temas = await prisma.temaColor.findMany({ orderBy: { creadoEn: 'desc' } })
  return NextResponse.json(temas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const tema = await prisma.temaColor.create({ data: body })
  return NextResponse.json(tema, { status: 201 })
}
