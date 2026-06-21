'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'

interface FotoC {
  id: number
  url: string
  titulo: string | null
  descripcion: string | null
}

export default function CarruselFotos({ fotos }: { fotos: FotoC[] }) {
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const siguiente = useCallback(() => {
    setActual((i) => (i + 1) % fotos.length)
  }, [fotos.length])

  const anterior = () => setActual((i) => (i - 1 + fotos.length) % fotos.length)

  // Auto-slide cada 5 segundos
  useEffect(() => {
    if (pausado || fotos.length <= 1) return
    const t = setInterval(siguiente, 5000)
    return () => clearInterval(t)
  }, [pausado, siguiente, fotos.length])

  if (fotos.length === 0) return null

  const foto = fotos[actual]

  return (
    <section className="relative w-full overflow-hidden bg-primary-dark"
      style={{ height: 'clamp(260px, 45vw, 520px)' }}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Imágenes */}
      {fotos.map((f, i) => (
        <div key={f.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === actual ? 'opacity-100' : 'opacity-0'}`}>
          <Image src={f.url} alt={f.titulo ?? 'La Dulcería tienda de regalos'}
            fill className="object-cover" priority={i === 0} sizes="100vw" />
          {/* Overlay degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      ))}

      {/* Texto de la foto activa */}
      {(foto.titulo || foto.descripcion) && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10">
          <div className="max-w-[1280px] mx-auto">
            {foto.titulo && (
              <h3 className="font-serif text-2xl md:text-4xl font-bold mb-2 drop-shadow">
                {foto.titulo}
              </h3>
            )}
            {foto.descripcion && (
              <p className="text-sm md:text-base opacity-90 max-w-xl drop-shadow">
                {foto.descripcion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flechas — solo si hay más de 1 foto */}
      {fotos.length > 1 && (
        <>
          <button onClick={anterior}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-xl font-bold transition-all"
            aria-label="Anterior">‹</button>
          <button onClick={siguiente}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-xl font-bold transition-all"
            aria-label="Siguiente">›</button>
        </>
      )}

      {/* Puntos indicadores */}
      {fotos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {fotos.map((_, i) => (
            <button key={i} onClick={() => setActual(i)}
              className={`rounded-full transition-all ${i === actual ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'}`}
              aria-label={`Foto ${i + 1}`} />
          ))}
        </div>
      )}
    </section>
  )
}
