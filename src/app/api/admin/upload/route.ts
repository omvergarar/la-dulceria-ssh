import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

function esAdmin(session: any) {
  return session?.user?.role === 'admin'
}

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TAMANO_MAX = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!esAdmin(session)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const archivo = formData.get('file') as File

    if (!archivo) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido (JPG, PNG, WEBP)' }, { status: 400 })
    }
    if (archivo.size > TAMANO_MAX) {
      return NextResponse.json({ error: 'El archivo supera el límite de 5 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await archivo.arrayBuffer())
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const nombreArchivo = `${uuidv4()}.${extension}`

    const directorio = join(process.cwd(), 'public', 'uploads', 'productos')
    await mkdir(directorio, { recursive: true })
    await writeFile(join(directorio, nombreArchivo), buffer)

    const url = `/uploads/productos/${nombreArchivo}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
