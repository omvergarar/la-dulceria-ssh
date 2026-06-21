'use client'

import { useState } from 'react'
import { formatearPrecio } from '@/lib/utils'

interface Props {
  codigo: string
  descuento: number
  envioGratisDesde: number
}

export default function BannerClient({ codigo, descuento, envioGratisDesde }: Props) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div
      className="text-white text-center py-2 px-10 text-sm font-semibold relative select-none"
      style={{
        background: 'linear-gradient(90deg,#c96bc4,#e89ee4,#c96bc4)',
        backgroundSize: '400% 100%',
        animation: 'shimmer 3s linear infinite',
      }}
    >
      🚀 Envío GRATIS en compras +{formatearPrecio(envioGratisDesde)} &nbsp;·&nbsp; Código{' '}
      <strong>{codigo}</strong> = {descuento}% OFF 🎀
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none"
        aria-label="Cerrar banner"
      >
        ✕
      </button>
    </div>
  )
}
