'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatearPrecio } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'

interface Foto { id: number; url: string; orden: number }

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoria: string
  imagenUrl: string | null
  fotos?: Foto[]
}

interface Props {
  producto: Producto
  relacionados: Array<Omit<Producto, 'fotos'> & { descripcion: string }>
}

export default function ProductoClient({ producto, relacionados }: Props) {
  const { agregarItem } = useCart()
  const [cantidad, setCantidad] = useState(1)
  const [mensaje, setMensaje] = useState('')
  const [agregado, setAgregado] = useState(false)

  const MAX_PALABRAS = 100
  function contarPalabras(texto: string) {
    return texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length
  }
  const palabrasUsadas = contarPalabras(mensaje)
  const palabrasRestantes = MAX_PALABRAS - palabrasUsadas

  function handleMensaje(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const texto = e.target.value
    if (contarPalabras(texto) <= MAX_PALABRAS) setMensaje(texto)
  }
  const fotos = producto.fotos ?? []
  const [fotoActiva, setFotoActiva] = useState<string | null>(
    fotos[0]?.url ?? producto.imagenUrl ?? null
  )

  function handleAgregar() {
    for (let i = 0; i < cantidad; i++) {
      agregarItem({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagenUrl: fotoActiva, mensaje })
    }
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const stockLabel =
    producto.stock <= 0
      ? { texto: 'Agotado', clase: 'bg-dulce-red text-white' }
      : producto.stock <= 3
      ? { texto: `¡Solo quedan ${producto.stock}!`, clase: 'bg-dulce-yellow text-text-dark' }
      : { texto: 'En stock', clase: 'bg-dulce-green text-white' }

  return (
    <div className="min-h-screen bg-bg-cream py-10 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-light mb-8 flex-wrap">
          <Link href="/" className="hover:text-accent">Inicio</Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-accent">Catálogo</Link>
          <span>/</span>
          <Link href={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`} className="hover:text-accent">
            {producto.categoria}
          </Link>
          <span>/</span>
          <span className="text-text-medium truncate max-w-[200px]">{producto.nombre}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Columna de imagen */}
          <div>
            {/* Foto principal */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-primary shadow-card mb-3">
              {fotoActiva ? (
                <Image src={fotoActiva} alt={producto.nombre} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🎁</div>
              )}
              <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${stockLabel.clase}`}>
                {stockLabel.texto}
              </span>
            </div>

            {/* Miniaturas — solo si hay más de 1 foto */}
            {fotos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {fotos.map((foto) => (
                  <button
                    key={foto.id}
                    onClick={() => setFotoActiva(foto.url)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${fotoActiva === foto.url ? 'border-accent scale-105' : 'border-primary-dark hover:border-accent'}`}
                  >
                    <Image src={foto.url} alt="miniatura" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalle */}
          <div>
            <span className="text-xs text-text-light uppercase tracking-wider font-semibold mb-2 block">{producto.categoria}</span>
            <h1 className="font-serif text-3xl md:text-4xl text-text-dark mb-4 leading-tight">{producto.nombre}</h1>
            <p className="text-3xl font-bold text-accent mb-6">{formatearPrecio(producto.precio)}</p>
            <p className="text-text-medium leading-relaxed mb-8">{producto.descripcion}</p>

            {/* Mensaje personalizado */}
            <div className="mb-6 bg-primary/40 border-2 border-primary-deeper rounded-xl p-4">
              <label className="block font-serif text-base font-semibold text-text-dark mb-1">
                💌 Mensaje personalizado
              </label>
              <p className="text-xs text-text-medium mb-3">
                Escribe el mensaje especial que acompañará este regalo. Se imprimirá en la tarjeta.
              </p>
              <textarea
                className="w-full px-4 py-3 border-2 border-primary-deeper rounded-lg text-sm bg-white text-text-dark focus:border-accent focus:outline-none transition-colors resize-none h-32"
                placeholder="Ej: ¡Feliz cumpleaños mi amor! Cada día a tu lado es un regalo. Te quiero muchísimo 💜"
                value={mensaje}
                onChange={handleMensaje}
              />
              <div className="flex justify-between items-center mt-1.5">
                <span className="text-xs text-text-light">Opcional — se incluye en la tarjeta del regalo</span>
                <span className={`text-xs font-semibold ${palabrasRestantes < 10 ? 'text-dulce-red' : 'text-text-medium'}`}>
                  {palabrasUsadas} / {MAX_PALABRAS} palabras
                </span>
              </div>
            </div>

            {/* Cantidad */}
            <div className="flex items-center gap-4 mb-8">
              <label className="form-label mb-0">Cantidad:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-8 h-8 rounded-full bg-primary text-accent-dark font-bold flex items-center justify-center hover:bg-accent hover:text-white transition-colors">−</button>
                <span className="w-8 text-center font-bold text-text-dark">{cantidad}</span>
                <button onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                  disabled={cantidad >= producto.stock}
                  className="w-8 h-8 rounded-full bg-primary text-accent-dark font-bold flex items-center justify-center hover:bg-accent hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">+</button>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleAgregar} disabled={producto.stock <= 0}
                className={`flex-1 py-3 rounded-full font-bold text-base transition-all ${producto.stock <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : agregado ? 'bg-dulce-green text-white' : 'bg-accent text-white hover:bg-accent-dark hover:-translate-y-0.5'}`}>
                {producto.stock <= 0 ? 'Agotado' : agregado ? '✓ ¡Agregado al carrito!' : 'Agregar al carrito 🛒'}
              </button>
              <Link href="/carrito" className="btn-outline px-6">Ver carrito</Link>
            </div>

            <div className="mt-6 bg-bg-soft rounded-lg p-4 flex gap-3 items-start">
              <span className="text-2xl">🚀</span>
              <div>
                <strong className="text-sm text-text-dark">Envío GRATIS en compras +$120.000</strong>
                <p className="text-xs text-text-medium mt-0.5">Entrega en Bogotá y área metropolitana</p>
              </div>
            </div>
          </div>
        </div>

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <section>
            <div className="section-header mb-8">
              <h2 className="font-serif text-2xl text-text-dark">También te puede gustar</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relacionados.map((p) => <ProductCard key={p.id} {...p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
