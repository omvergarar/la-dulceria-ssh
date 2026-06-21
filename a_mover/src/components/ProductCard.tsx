'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatearPrecio } from '@/lib/utils'

interface ProductCardProps {
  id: number
  nombre: string
  precio: number | string
  stock: number
  categoria: string
  imagenUrl: string | null
  descripcion?: string
}

export default function ProductCard({
  id,
  nombre,
  precio,
  stock,
  categoria,
  imagenUrl,
  descripcion,
}: ProductCardProps) {
  const { agregarItem } = useCart()
  const [agregado, setAgregado] = useState(false)
  const precioNum = Number(precio)

  function handleAgregar(e: React.MouseEvent) {
    e.preventDefault()
    if (stock <= 0) return
    agregarItem({ id, nombre, precio: precioNum, imagenUrl })
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1500)
  }

  const stockLabel =
    stock <= 0
      ? { texto: 'Agotado', clase: 'bg-dulce-red' }
      : stock <= 3
      ? { texto: 'Últimas unidades', clase: 'bg-dulce-yellow text-text-dark' }
      : { texto: 'En stock', clase: 'bg-dulce-green' }

  return (
    <Link href={`/producto/${id}`} className="block">
      <article className="bg-white rounded-xl shadow-card overflow-hidden hover:-translate-y-1 hover:shadow-hover transition-all duration-300 group">
        {/* Imagen */}
        <div className="relative overflow-hidden h-48">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={nombre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-400"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-5xl">
              🎁
            </div>
          )}
          {/* Badge stock */}
          <span
            className={`absolute top-2 left-2 text-white text-[11px] font-bold px-2 py-0.5 rounded-full ${stockLabel.clase}`}
          >
            {stockLabel.texto}
          </span>
        </div>

        {/* Cuerpo */}
        <div className="p-4">
          <p className="text-[11px] text-text-light uppercase tracking-wider mb-1">{categoria}</p>
          <h3 className="font-serif font-semibold text-text-dark leading-snug mb-1 line-clamp-2">
            {nombre}
          </h3>
          {descripcion && (
            <p className="text-xs text-text-medium line-clamp-2 mb-2 leading-relaxed">
              {descripcion}
            </p>
          )}
          <p className="text-accent font-bold text-base mb-3">{formatearPrecio(precioNum)}</p>

          <button
            onClick={handleAgregar}
            disabled={stock <= 0}
            className={`w-full py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
              stock <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : agregado
                ? 'bg-dulce-green text-white'
                : 'bg-accent text-white hover:bg-accent-dark'
            }`}
          >
            {stock <= 0 ? 'Agotado' : agregado ? '✓ Agregado' : 'Agregar al carrito'}
          </button>
        </div>
      </article>
    </Link>
  )
}
