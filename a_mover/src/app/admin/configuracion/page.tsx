import { prisma } from '@/lib/prisma'
import ConfiguracionClient from './ConfiguracionClient'

export const metadata = { title: 'Configuración — Admin La Dulcería tienda de regalos' }

export default async function ConfiguracionPage() {
  const [config, codigos] = await Promise.all([
    prisma.configTienda.findUnique({ where: { id: 1 } }),
    prisma.codigoPromo.findMany({ orderBy: { creadoEn: 'desc' } }),
  ])

  return (
    <ConfiguracionClient
      configInicial={{
        bannerActivo: config?.bannerActivo ?? true,
        codigoPromo: config?.codigoPromo ?? 'DULCE15',
        descuentoPorcentaje: config?.descuentoPorcentaje ?? 15,
        envioGratisDesde: config?.envioGratisDesde ?? 120000,
      }}
      codigosIniciales={codigos.map((c) => ({
        id: c.id,
        codigo: c.codigo,
        descuento: c.descuento,
        activo: c.activo,
        descripcion: c.descripcion,
        creadoEn: c.creadoEn.toISOString(),
      }))}
    />
  )
}
