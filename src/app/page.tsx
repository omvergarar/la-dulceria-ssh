import { prisma } from '@/lib/prisma'
import LandingClient from '@/components/LandingClient'
import CarruselFotos from '@/components/CarruselFotos'
import WelcomeModal from '@/components/WelcomeModal'

export default async function Home() {
  const [totalProductos, categorias, productosDestacados, resenasAprobadas, promedioStats, fotosCarrusel, config] =
    await Promise.all([
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.groupBy({ by: ['categoria'], where: { activo: true } }),
      prisma.producto.findMany({
        where: { activo: true, stock: { gt: 0 } },
        take: 4,
        orderBy: { fechaCreacion: 'desc' },
      }),
      prisma.resena.findMany({
        where: { aprobada: true },
        orderBy: { creadoEn: 'desc' },
        take: 20,
      }),
      prisma.resena.aggregate({
        where: { aprobada: true },
        _avg: { estrellas: true },
        _count: { id: true },
      }),
      prisma.fotoCarrusel.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      }),
      prisma.configTienda.findUnique({ where: { id: 1 } }),
    ])

  const promedio =
    promedioStats._count.id > 0
      ? Math.round((promedioStats._avg.estrellas ?? 0) * 10) / 10
      : 4.9

  const codigo = config?.codigoPromo ?? 'DULCE15'
  const descuento = config?.descuentoPorcentaje ?? 15

  return (
    <>
      <WelcomeModal codigo={codigo} descuento={descuento} />
      {/* Carrusel de fotos — aparece solo si hay fotos activas cargadas desde el admin */}
      <CarruselFotos
        fotos={fotosCarrusel.map((f) => ({
          id: f.id,
          url: f.url,
          titulo: f.titulo,
          descripcion: f.descripcion,
        }))}
      />

      <LandingClient
        stats={{
          categorias: categorias.length,
          productos: totalProductos,
          promedio,
          resenas: promedioStats._count.id,
        }}
        productosDestacados={productosDestacados.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio),
          stock: p.stock,
          categoria: p.categoria,
          imagenUrl: p.imagenUrl,
          descripcion: p.descripcion,
        }))}
        resenasAprobadas={resenasAprobadas.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          ciudad: r.ciudad ?? 'Colombia',
          texto: r.texto,
          estrellas: r.estrellas,
        }))}
      />
    </>
  )
}
