import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

function esAdmin(s: any) { return s?.user?.role === 'admin' }

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TAMANO_MAX = 5 * 1024 * 1024
const MAX_FOTOS = 3

// GET — obtener fotos de un producto
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fotos = await prisma.fotoProducto.findMany({
    where: { productoId: Number(id) },
    orderBy: { orden: 'asc' },
  })
  return NextResponse.json(fotos)
}

// POST — subir una nueva foto (máximo 3 por producto)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const productoId = Number(id)

  // Verificar límite de 3 fotos
  const total = await prisma.fotoProducto.count({ where: { productoId } })
  if (total >= MAX_FOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_FOTOS} fotos por producto` }, { status: 400 })
  }

  const formData = await req.formData()
  const archivo = formData.get('file') as File
  if (!archivo) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (!TIPOS_PERMITIDOS.includes(archivo.type))
    return NextResponse.json({ error: 'Tipo no permitido (JPG, PNG, WEBP)' }, { status: 400 })
  if (archivo.size > TAMANO_MAX)
    return NextResponse.json({ error: 'El archivo supera 5 MB' }, { status: 400 })

  const buffer = Buffer.from(await archivo.arrayBuffer())
  const ext = archivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const nombre = `${uuidv4()}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', 'productos')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, nombre), buffer)

  const url = `/uploads/productos/${nombre}`
  const foto = await prisma.fotoProducto.create({ data: { productoId, url, orden: total } })

  // Si es la primera foto, también actualiza imagenUrl del producto
  if (total === 0) {
    await prisma.producto.update({ where: { id: productoId }, data: { imagenUrl: url } })
  }

  return NextResponse.json(foto, { status: 201 })
}

// DELETE — eliminar una foto por su id (query param ?fotoId=X)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const productoId = Number(id)
  const fotoId = Number(new URL(req.url).searchParams.get('fotoId'))

  await prisma.fotoProducto.delete({ where: { id: fotoId, productoId } })

  // Si se eliminó la foto principal, actualizar imagenUrl al siguiente
  const primera = await prisma.fotoProducto.findFirst({
    where: { productoId },
    orderBy: { orden: 'asc' },
  })
  await prisma.producto.update({
    where: { id: productoId },
    data: { imagenUrl: primera?.url ?? null },
  })

  return NextResponse.json({ ok: true })
}
