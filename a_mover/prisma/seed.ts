import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de La Dulcería...')

  // Crear cliente de prueba
  const hash = await bcrypt.hash('cliente123', 12)
  await prisma.cliente.upsert({
    where: { email: 'cliente@ejemplo.com' },
    update: {},
    create: {
      nombre: 'María García',
      email: 'cliente@ejemplo.com',
      contrasena: hash,
      telefono: '+57 300 000 0001',
      direccion: 'Calle 100 #15-20, Bogotá',
    },
  })

  // Productos de ejemplo
  const productos = [
    {
      nombre: 'Caja de Regalo Romántica',
      descripcion: 'Hermosa caja artesanal con chocolates finos, vela aromática de lavanda y tarjeta personalizada. Perfecta para sorprender en cualquier ocasión especial.',
      precio: 89000,
      stock: 15,
      categoria: 'Cajas de Regalo',
      imagenUrl: null,
    },
    {
      nombre: 'Desayuno Sorpresa Deluxe',
      descripcion: 'Canasta con pan artesanal, mermeladas gourmet, frutas frescas, jugo natural y chocolates. Entrega a domicilio con globos incluidos.',
      precio: 120000,
      stock: 8,
      categoria: 'Desayunos Sorpresa',
      imagenUrl: null,
    },
    {
      nombre: 'Set de Velas Aromáticas',
      descripcion: 'Colección de 3 velas artesanales de soya con aromas de vainilla, rosa y lavanda. Duración 40 horas cada una. Empaque premium.',
      precio: 65000,
      stock: 20,
      categoria: 'Velas Artesanales',
      imagenUrl: null,
    },
    {
      nombre: 'Peluche Osito con Rosas',
      descripcion: 'Tierno osito de peluche acompañado de 6 rosas artificiales eternas y lazo decorativo. El regalo favorito para demostrar amor.',
      precio: 75000,
      stock: 12,
      categoria: 'Peluches y Flores',
      imagenUrl: null,
    },
    {
      nombre: 'Caja Chocolates Belgas',
      descripcion: 'Selección de 16 chocolates belgas importados en presentaciones de leche, oscuro y blanco. Caja elegante con moño incluido.',
      precio: 95000,
      stock: 25,
      categoria: 'Chocolates y Dulces',
      imagenUrl: null,
    },
    {
      nombre: 'Kit Spa en Casa',
      descripcion: 'Set de relajación con sales de baño, mascarilla facial, vela aromática, toallita de lujo y taza personalizada. El mejor regalo de autocuidado.',
      precio: 110000,
      stock: 10,
      categoria: 'Kits Especiales',
      imagenUrl: null,
    },
    {
      nombre: 'Taza Personalizada con Foto',
      descripcion: 'Taza de cerámica de alta calidad con tu foto o mensaje favorito impreso a todo color. Microondas y lavavajillas compatible.',
      precio: 45000,
      stock: 30,
      categoria: 'Personalizados',
      imagenUrl: null,
    },
    {
      nombre: 'Canasta de Frutas Premium',
      descripcion: 'Canasta artesanal con frutas exóticas de temporada, quesos artesanales, galletas gourmet y vino espumoso. Para momentos únicos.',
      precio: 155000,
      stock: 6,
      categoria: 'Desayunos Sorpresa',
      imagenUrl: null,
    },
  ]

  for (const producto of productos) {
    await prisma.producto.create({ data: producto as any })
  }

  console.log('✅ Seed completado. Productos creados:', productos.length)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
