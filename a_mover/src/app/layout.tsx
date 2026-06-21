import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SessionProvider from '@/components/SessionProvider'
import { CartProvider } from '@/context/CartContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import Banner from '@/components/Banner'

export const metadata: Metadata = {
  title: 'La Dulcería tienda de regalos — Regalos con Amor | Bogotá, Colombia',
  description:
    'Regalos únicos y personalizados en Bogotá. Desayunos sorpresa, cajas de regalo, velas y más. Envío a domicilio.',
  keywords: 'regalos Bogotá, desayunos sorpresa, cajas de regalo, velas, peluches, chocolates, Colombia',
  authors: [{ name: 'La Dulcería tienda de regalos' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'La Dulcería tienda de regalos — Regalos con Amor',
    description: 'Regalos únicos y personalizados en Bogotá, Colombia.',
    locale: 'es_CO',
    siteName: 'La Dulcería tienda de regalos',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  const temaActivo = await prisma.temaActivo.findUnique({ where: { id: 1 } })

  // CSS vars del tema activo inyectadas server-side para evitar flash
  const cssVars = temaActivo
    ? `:root{--primary:${temaActivo.primary};--primary-dark:${temaActivo.primaryDark};--primary-deeper:${temaActivo.primaryDeeper};--accent:${temaActivo.accent};--accent-dark:${temaActivo.accentDark};--text-dark:${temaActivo.textDark};}`
    : ''

  return (
    <html lang="es-CO">
      <head>{cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}</head>
      <body className="font-sans bg-bg-cream text-text-dark">
        <SessionProvider session={session}>
          <CartProvider>
            <Banner />
            <Navbar />
            <main>{children}</main>
            <Footer />
            <WhatsAppButton />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
