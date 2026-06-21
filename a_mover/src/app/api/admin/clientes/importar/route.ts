import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Parsea una línea CSV respetando campos entre comillas que pueden contener comas
function parsearLineaCSV(linea: string): string[] {
  const campos: string[] = []
  let actual = ''
  let dentroComillas = false

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"') {
      dentroComillas = !dentroComillas
    } else if (c === ',' && !dentroComillas) {
      campos.push(actual.trim())
      actual = ''
    } else {
      actual += c
    }
  }
  campos.push(actual.trim())
  return campos
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const texto = await req.text()
    const lineas = texto.split('\n').map((l) => l.trim()).filter(Boolean)

    if (lineas.length < 2) return NextResponse.json({ error: 'El CSV está vacío o solo tiene encabezado.' }, { status: 400 })

    // Validar encabezado — columnas esperadas: ID,Nombre,Email,Teléfono,Dirección,Activo,Fecha Registro,Pedidos
    const encabezado = parsearLineaCSV(lineas[0]).map((h) => h.toLowerCase())
    const idxNombre = encabezado.findIndex((h) => h.includes('nombre'))
    const idxEmail = encabezado.findIndex((h) => h.includes('email'))
    const idxTelefono = encabezado.findIndex((h) => h.includes('tel'))
    const idxDireccion = encabezado.findIndex((h) => h.includes('direcci'))

    if (idxNombre === -1 || idxEmail === -1) {
      return NextResponse.json({ error: 'El CSV debe tener columnas Nombre y Email.' }, { status: 400 })
    }

    let creados = 0
    let omitidos = 0

    for (let i = 1; i < lineas.length; i++) {
      const cols = parsearLineaCSV(lineas[i])
      const nombre = cols[idxNombre]?.trim() ?? ''
      const email = cols[idxEmail]?.trim().toLowerCase() ?? ''

      if (!nombre || !email) { omitidos++; continue }

      const existente = await prisma.cliente.findUnique({ where: { email } })
      if (existente) { omitidos++; continue }

      try {
        const contrasena = await bcrypt.hash('Dulceria2024!', 12)
        await prisma.cliente.create({
          data: {
            nombre,
            email,
            contrasena,
            telefono: idxTelefono !== -1 && cols[idxTelefono]?.trim() ? cols[idxTelefono].trim() : null,
            direccion: idxDireccion !== -1 && cols[idxDireccion]?.trim() ? cols[idxDireccion].trim() : null,
          },
        })
        creados++
      } catch {
        omitidos++
      }
    }

    return NextResponse.json({ creados, omitidos })
  } catch {
    return NextResponse.json({ error: 'El archivo no es válido.' }, { status: 400 })
  }
}
