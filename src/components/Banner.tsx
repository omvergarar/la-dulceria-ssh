import { prisma } from '@/lib/prisma'
import BannerClient from './BannerClient'

// Server component — lee la configuración desde BD en cada request
export default async function Banner() {
  const config = await prisma.configTienda.findUnique({ where: { id: 1 } })

  if (!config || !config.bannerActivo) return null

  return (
    <BannerClient
      codigo={config.codigoPromo}
      descuento={config.descuentoPorcentaje}
      envioGratisDesde={config.envioGratisDesde}
    />
  )
}
