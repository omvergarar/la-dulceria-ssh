'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatearPrecio } from '@/lib/utils'

type Paso = 1 | 2

interface DatosEnvio {
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  notas: string
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { estado, vaciarCarrito } = useCart()
  const [paso, setPaso] = useState<Paso>(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [ordenCreada, setOrdenCreada] = useState<{ id: number; referencia: string; total: number } | null>(null)
  const [firmaWompi, setFirmaWompi] = useState('')

  // Estado del código de descuento
  const [codigoInput, setCodigoInput] = useState('')
  const [codigoValidado, setCodigoValidado] = useState<{ codigo: string; descuento: number } | null>(null)
  const [validandoCodigo, setValidandoCodigo] = useState(false)
  const [errorCodigo, setErrorCodigo] = useState('')

  const [datos, setDatos] = useState<DatosEnvio>({
    nombre: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    telefono: '',
    direccion: '',
    ciudad: 'Bogotá',
    notas: '',
  })

  const descuento = codigoValidado ? Math.round((estado.total * codigoValidado.descuento) / 100) : 0
  const totalFinal = estado.total - descuento

  useEffect(() => {
    if (session?.user) {
      setDatos((d) => ({
        ...d,
        nombre: session.user?.name ?? d.nombre,
        email: session.user?.email ?? d.email,
      }))
    }
  }, [session])

  if (estado.items.length === 0 && !ordenCreada) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
          <h1 className="font-serif text-2xl text-text-dark mb-4">Tu carrito está vacío</h1>
          <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
        </div>
      </div>
    )
  }

  async function aplicarCodigo() {
    if (!codigoInput.trim()) return
    setValidandoCodigo(true); setErrorCodigo('')
    try {
      const res = await fetch('/api/ordenes/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorCodigo(data.error); setCodigoValidado(null) }
      else { setCodigoValidado(data); setErrorCodigo('') }
    } finally {
      setValidandoCodigo(false)
    }
  }

  function validarPaso1() {
    if (!datos.nombre.trim()) return 'Ingresa tu nombre completo'
    if (!datos.email.includes('@')) return 'Ingresa un correo válido'
    if (!datos.telefono.trim()) return 'Ingresa tu teléfono'
    if (!datos.direccion.trim()) return 'Ingresa tu dirección de envío'
    return ''
  }

  async function crearOrden() {
    const err = validarPaso1()
    if (err) { setError(err); return }
    setError(''); setCargando(true)
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: estado.items,
          datos,
          total: totalFinal,
          codigoPromo: codigoValidado?.codigo ?? undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear la orden')
      setOrdenCreada(json)
      setFirmaWompi(json.firma)
      vaciarCarrito()
      setPaso(2)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  function PasoIndicador() {
    return (
      <div className="mb-8">
        <div className="flex gap-2 mb-2">
          {['Datos de envío', 'Pago'].map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < paso ? 'bg-accent' : 'bg-primary-dark'}`} />
          ))}
        </div>
        <div className="flex justify-between">
          {['Datos de envío', 'Pago'].map((p, i) => (
            <span key={p} className={`text-xs font-semibold ${i + 1 === paso ? 'text-accent' : 'text-text-light'}`}>{p}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-cream py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl text-text-dark mb-6">Checkout</h1>
        <PasoIndicador />

        {/* === PASO 1: Datos de envío === */}
        {paso === 1 && (
          <>
            <div className="bg-white rounded-xl p-8 shadow-card mb-6">
              <h2 className="font-serif text-xl text-text-dark mb-6">Datos de envío</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombre completo *</label>
                    <input className="form-input" placeholder="Tu nombre"
                      value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Correo electrónico *</label>
                    <input type="email" className="form-input" placeholder="tu@correo.com"
                      value={datos.email} onChange={(e) => setDatos({ ...datos, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Teléfono / WhatsApp *</label>
                    <input type="tel" className="form-input" placeholder="+57 300 000 0000"
                      value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Ciudad</label>
                    <input className="form-input" placeholder="Bogotá"
                      value={datos.ciudad} onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Dirección de envío *</label>
                  <input className="form-input" placeholder="Calle 100 #15-20, Apartamento 301"
                    value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Notas adicionales (opcional)</label>
                  <textarea className="form-input resize-none h-16"
                    placeholder="Indicaciones especiales para la entrega..."
                    value={datos.notas} onChange={(e) => setDatos({ ...datos, notas: e.target.value })} />
                </div>
              </div>
              {error && <p className="text-dulce-red text-sm mt-4 font-medium">{error}</p>}
            </div>

            {/* Resumen + código de descuento */}
            <div className="bg-white rounded-xl p-6 shadow-card mb-6">
              <h2 className="font-serif text-xl text-text-dark mb-4">Resumen del pedido</h2>
              {estado.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-primary-dark last:border-0">
                  <span className="text-text-medium">{item.nombre} × {item.cantidad}</span>
                  <span className="font-semibold">{formatearPrecio(item.precio * item.cantidad)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-text-medium mt-3 mb-1">
                <span>Subtotal</span><span>{formatearPrecio(estado.total)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-dulce-green font-semibold mb-1">
                  <span>Descuento ({codigoValidado?.codigo} -{codigoValidado?.descuento}%)</span>
                  <span>-{formatearPrecio(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl text-text-dark border-t border-primary-dark pt-3 mt-2">
                <span>Total</span>
                <span className="text-accent">{formatearPrecio(totalFinal)}</span>
              </div>

              {/* Campo de código de descuento */}
              <div className="mt-5 pt-4 border-t border-primary-dark">
                <label className="form-label">¿Tienes un código de descuento?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`form-input uppercase flex-1 ${codigoValidado ? 'border-dulce-green bg-green-50' : ''}`}
                    placeholder="Ej: DULCE15"
                    value={codigoInput}
                    onChange={(e) => {
                      setCodigoInput(e.target.value.toUpperCase())
                      if (codigoValidado) setCodigoValidado(null)
                    }}
                    disabled={!!codigoValidado}
                  />
                  {codigoValidado ? (
                    <button type="button"
                      onClick={() => { setCodigoValidado(null); setCodigoInput('') }}
                      className="px-3 py-2 bg-gray-100 text-text-medium rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap">
                      Quitar
                    </button>
                  ) : (
                    <button type="button" onClick={aplicarCodigo} disabled={validandoCodigo || !codigoInput.trim()}
                      className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent-dark transition-colors disabled:opacity-50 whitespace-nowrap">
                      {validandoCodigo ? '...' : 'Aplicar'}
                    </button>
                  )}
                </div>
                {codigoValidado && (
                  <p className="text-dulce-green text-xs font-semibold mt-1.5">
                    ✓ Código aplicado: -{codigoValidado.descuento}% de descuento
                  </p>
                )}
                {errorCodigo && <p className="text-dulce-red text-xs mt-1.5">{errorCodigo}</p>}
              </div>
            </div>
          </>
        )}

        {/* === PASO 2: Pago con Wompi === */}
        {paso === 2 && ordenCreada && (
          <div className="bg-white rounded-xl p-8 shadow-card mb-6">
            <h2 className="font-serif text-xl text-text-dark mb-4">Pago seguro 🔒</h2>
            <p className="text-text-medium text-sm mb-6">
              Serás redirigido al portal de pago de Wompi para completar tu compra de forma segura.
            </p>
            <div className="bg-bg-soft rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm text-text-medium mb-1">
                <span>Referencia:</span>
                <span className="font-mono text-xs">{ordenCreada.referencia}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-text-dark">
                <span>Total a pagar:</span>
                <span className="text-accent">{formatearPrecio(ordenCreada.total)}</span>
              </div>
            </div>
            <div className="text-center">
              <form action="https://checkout.wompi.co/p/" method="GET">
                <input type="hidden" name="public-key" value={process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY} />
                <input type="hidden" name="currency" value="COP" />
                <input type="hidden" name="amount-in-cents" value={String(ordenCreada.total * 100)} />
                <input type="hidden" name="reference" value={ordenCreada.referencia} />
                <input type="hidden" name="signature:integrity" value={firmaWompi} />
                <input type="hidden" name="customer-data:email" value={datos.email} />
                <input type="hidden" name="customer-data:full-name" value={datos.nombre} />
                <input type="hidden" name="customer-data:phone-number" value={datos.telefono} />
                <input type="hidden" name="redirect-url"
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmacion?ref=${ordenCreada.referencia}`} />
                <button type="submit"
                  className="w-full bg-accent text-white py-4 rounded-full font-bold text-lg hover:bg-accent-dark transition-all hover:-translate-y-0.5 shadow-soft">
                  Pagar con Wompi →
                </button>
              </form>
              <p className="text-xs text-text-light mt-3">Acepta tarjetas de crédito, débito, PSE y Nequi</p>
            </div>
          </div>
        )}

        {/* Botón continuar */}
        {paso === 1 && (
          <button onClick={crearOrden} disabled={cargando}
            className="w-full bg-accent text-white py-3.5 rounded-full font-bold text-lg hover:bg-accent-dark transition-all disabled:opacity-60">
            {cargando ? 'Procesando...' : 'Continuar al pago →'}
          </button>
        )}

        {!session && paso === 1 && (
          <p className="text-center text-sm text-text-light mt-4">
            ¿Tienes cuenta?{' '}
            <Link href="/login?callbackUrl=/checkout" className="text-accent hover:underline">Inicia sesión</Link>{' '}
            para autocompletar tus datos y habilitar el control de códigos usados
          </p>
        )}
      </div>
    </div>
  )
}
