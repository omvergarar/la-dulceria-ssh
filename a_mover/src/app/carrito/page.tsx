'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { formatearPrecio } from '@/lib/utils'

const MAX_PALABRAS = 100
function contarPalabras(texto: string) {
  return texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length
}

function MensajeItem({ mensaje, onChange }: { mensaje: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const palabras = contarPalabras(mensaje)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (contarPalabras(e.target.value) <= MAX_PALABRAS) onChange(e.target.value)
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="text-xs text-accent flex items-center gap-1 hover:underline"
      >
        💌 {abierto ? 'Ocultar mensaje personalizado' : 'Agregar mensaje personalizado'}
        {mensaje && !abierto && <span className="text-dulce-green font-bold ml-1">✓</span>}
      </button>
      {abierto && (
        <div className="mt-2 bg-primary/30 border border-primary-deeper rounded-lg p-3">
          <textarea
            className="w-full border border-primary-deeper rounded-md p-2 text-xs bg-white resize-none h-20 focus:border-accent focus:outline-none"
            placeholder="Ej: ¡Feliz cumpleaños! Con mucho cariño 💜"
            value={mensaje}
            onChange={handleChange}
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-semibold ${MAX_PALABRAS - palabras < 10 ? 'text-dulce-red' : 'text-text-light'}`}>
              {palabras} / {MAX_PALABRAS} palabras
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarritoPage() {
  const { estado, quitarItem, actualizarCantidad, actualizarMensaje, vaciarCarrito } = useCart()

  const totalFinal = estado.total

  if (estado.items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-7xl block mb-6">🛒</span>
          <h1 className="font-serif text-3xl text-text-dark mb-3">Tu carrito está vacío</h1>
          <p className="text-text-medium mb-8">¡Explora nuestro catálogo y encuentra el regalo perfecto!</p>
          <Link href="/catalogo" className="btn-primary">
            Ver catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-cream py-10 px-6">
      <div className="max-w-[1280px] mx-auto">
        <h1 className="font-serif text-3xl text-text-dark mb-8">Mi carrito 🛒</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Items */}
          <div className="space-y-4">
            {estado.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-5 shadow-card">
                <div className="flex gap-4">
                  {/* Imagen */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-primary">
                    {item.imagenUrl ? (
                      <Image src={item.imagenUrl} alt={item.nombre} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
                    )}
                  </div>

                  {/* Detalle */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-text-dark mb-1 truncate">{item.nombre}</h3>
                    <p className="text-sm text-text-light mb-2">{formatearPrecio(item.precio)} c/u</p>

                    {/* Controles cantidad */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                          className="w-7 h-7 rounded-full bg-primary text-accent-dark font-bold flex items-center justify-center hover:bg-accent hover:text-white transition-colors text-lg leading-none"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-text-dark">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          className="w-7 h-7 rounded-full bg-primary text-accent-dark font-bold flex items-center justify-center hover:bg-accent hover:text-white transition-colors text-lg leading-none"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-accent font-bold ml-auto">
                        {formatearPrecio(item.precio * item.cantidad)}
                      </span>
                      <button
                        onClick={() => quitarItem(item.id)}
                        className="text-text-light hover:text-dulce-red transition-colors text-lg"
                        aria-label="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mensaje personalizado */}
                <MensajeItem
                  mensaje={item.mensaje || ''}
                  onChange={(v) => actualizarMensaje(item.id, v)}
                />
              </div>
            ))}

            <button
              onClick={vaciarCarrito}
              className="text-sm text-text-light hover:text-dulce-red transition-colors underline"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl p-6 shadow-card h-fit sticky top-24">
            <h2 className="font-serif text-xl text-text-dark mb-5">Resumen del pedido</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm text-text-medium">
                <span>Subtotal ({estado.cantidad} {estado.cantidad === 1 ? 'producto' : 'productos'})</span>
                <span>{formatearPrecio(estado.total)}</span>
              </div>
              <div className="border-t border-primary-dark pt-3 flex justify-between font-bold text-lg text-text-dark">
                <span>Total</span>
                <span className="text-accent">{formatearPrecio(totalFinal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-accent text-white text-center py-3.5 rounded-full font-bold text-base hover:bg-accent-dark transition-all hover:-translate-y-0.5 mb-3"
            >
              Proceder al pago →
            </Link>
            <Link
              href="/catalogo"
              className="block w-full text-center text-sm text-text-medium hover:text-accent transition-colors"
            >
              Continuar comprando
            </Link>

            {/* Íconos de seguridad */}
            <div className="mt-5 pt-4 border-t border-primary-dark">
              <div className="flex items-center gap-2 text-xs text-text-light justify-center">
                <span>🔒</span>
                <span>Pago seguro con Wompi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
