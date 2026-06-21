import { prisma } from '@/lib/prisma'
import TemasAdminClient from './TemasAdminClient'

export const metadata = { title: 'Temas de color — Admin La Dulcería' }

export default async function AdminTemasPage() {
  const [temaActivo, temas] = await Promise.all([
    prisma.temaActivo.findUnique({ where: { id: 1 } }),
    prisma.temaColor.findMany({ orderBy: { creadoEn: 'desc' } }),
  ])

  const toObj = (t: any) => ({
    id: t.id,
    nombre: t.nombre,
    primary: t.primary,
    primaryDark: t.primaryDark,
    primaryDeeper: t.primaryDeeper,
    accent: t.accent,
    accentDark: t.accentDark,
    textDark: t.textDark,
    creadoEn: t.creadoEn?.toISOString?.() ?? null,
  })

  return (
    <TemasAdminClient
      temaActivoInicial={temaActivo ? toObj(temaActivo) : null}
      temasGuardados={temas.map(toObj)}
    />
  )
}
