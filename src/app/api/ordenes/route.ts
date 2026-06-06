import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generarFirmaWompi, copACentavos } from '@/lib/wompi'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const ItemSchema = z.object({
  id: z.number(),
  cantidad: z.number().min(1),
  precio: z.number().min(0),
  nombre: z.string(),
  mensaje: z.string().max(1000).optional(),
})

const DatosSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().min(7),
  direccion: z.string().min(5),
  ciudad: z.string().optional(),
  notas: z.string().optional(),
})

const OrdenSchema = z.object({
  items: z.array(ItemSchema).min(1),
  datos: DatosSchema,
  total: z.number().min(0),
  codigoPromo: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const validacion = OrdenSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { items, datos, codigoPromo } = validacion.data

    // Verificar stock y calcular subtotal real
    let subtotal = 0
    for (const item of items) {
      const producto = await prisma.producto.findUnique({ where: { id: item.id, activo: true } })
      if (!producto) {
        return NextResponse.json({ error: `Producto ${item.nombre} no disponible` }, { status: 400 })
      }
      if (producto.stock < item.cantidad) {
        return NextResponse.json({ error: `Stock insuficiente para ${producto.nombre}` }, { status: 400 })
      }
      subtotal += Number(producto.precio) * item.cantidad
    }

    // Obtener o crear cliente PRIMERO para poder verificar uso de cupón
    let clienteId: number
    if (session && (session.user as any)?.role === 'cliente') {
      clienteId = Number((session.user as any).id)
    } else {
      const bcrypt = await import('bcryptjs')
      const clienteTemporal = await prisma.cliente.upsert({
        where: { email: datos.email },
        update: { nombre: datos.nombre, telefono: datos.telefono },
        create: {
          email: datos.email,
          nombre: datos.nombre,
          telefono: datos.telefono,
          direccion: datos.direccion,
          contrasena: await bcrypt.hash(uuidv4(), 10),
        },
      })
      clienteId = clienteTemporal.id
    }

    // Validar y aplicar código de descuento (uso único por cliente)
    let descuentoAplicado = 0
    let codigoValidado: string | null = null

    if (codigoPromo) {
      const codigoUpper = codigoPromo.toUpperCase().trim()
      const promo = await prisma.codigoPromo.findUnique({ where: { codigo: codigoUpper } })

      if (promo && promo.activo) {
        const yaUsado = await prisma.codigoUsado.findUnique({
          where: { clienteId_codigo: { clienteId, codigo: codigoUpper } },
        })
        if (yaUsado) {
          return NextResponse.json({ error: 'Este código ya fue utilizado por tu cuenta' }, { status: 400 })
        }
        descuentoAplicado = Math.round((subtotal * promo.descuento) / 100)
        codigoValidado = codigoUpper
      }
    }

    const totalFinal = subtotal - descuentoAplicado

    const referencia = `DULCERIA-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`

    // Crear orden
    const orden = await prisma.orden.create({
      data: {
        clienteId,
        total: totalFinal,
        estado: 'pendiente',
        referenciaPago: referencia,
        direccionEnvio: `${datos.direccion}, ${datos.ciudad ?? 'Bogotá'}`,
        notas: datos.notas ?? null,
        codigoPromo: codigoValidado,
        descuentoAplicado: descuentoAplicado > 0 ? descuentoAplicado : null,
        detalles: {
          create: items.map((item) => ({
            productoId: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            mensaje: item.mensaje ?? null,
          })),
        },
      },
    })

    // Reducir stock
    for (const item of items) {
      await prisma.producto.update({
        where: { id: item.id },
        data: { stock: { decrement: item.cantidad } },
      })
    }

    // Registrar uso del código (para control de uso único)
    if (codigoValidado) {
      await prisma.codigoUsado.create({
        data: { clienteId, codigo: codigoValidado },
      }).catch(() => {}) // Si ya existe (race condition) lo ignoramos
    }

    // Generar firma Wompi
    const firma = await generarFirmaWompi(referencia, copACentavos(totalFinal), 'COP')

    return NextResponse.json({
      id: orden.id,
      referencia,
      firma,
      total: totalFinal,
      descuentoAplicado,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creando orden:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
