import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const resenas = await prisma.resena.findMany({ orderBy: { creadoEn: 'desc' } })
  return NextResponse.json(resenas)
}
