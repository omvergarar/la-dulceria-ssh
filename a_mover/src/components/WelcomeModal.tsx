'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  codigo: string
  descuento: number
}

export default function WelcomeModal({ codigo, descuento }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' })
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) return
    const timer = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [session])

  function cerrar() {
    setVisible(false)
  }

  async function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.includes('@')) {
      setError('Ingresa tu nombre y correo válido.')
      return
    }
    setError('')
    setEnviando(true)
    try {
      const password = Math.random().toString(36).slice(-10) + 'A1!'
      const res = await fetch('/api/clientes/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.toLowerCase().trim(),
          telefono: form.telefono.trim() || undefined,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          // Ya tiene cuenta — redirigir al login
          cerrar()
          router.push('/login')
          return
        }
        throw new Error(data.error || 'Error al registrar')
      }
      setExito(true)
      // Cerrar automáticamente después de 5s
      setTimeout(cerrar, 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4"
      style={{ background: 'rgba(45,26,43,0.60)' }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md relative overflow-hidden shadow-hover"
        style={{ animation: 'popIn 0.35s ease-out' }}
      >
        {/* Franja decorativa superior */}
        <div
          className="h-2 w-full"
          style={{ background: 'linear-gradient(90deg,#c96bc4,#e89ee4,#c96bc4)' }}
        />

        <div className="p-8">
          <button
            onClick={cerrar}
            className="absolute top-4 right-4 text-text-light hover:text-text-dark text-2xl leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {exito ? (
            <div className="text-center py-4">
              <span className="text-6xl block mb-4">🎉</span>
              <h2 className="font-serif text-2xl text-text-dark mb-2">
                ¡Bienvenida a La Dulcería tienda de regalos!
              </h2>
              <p className="text-text-medium mb-4">Tu código de descuento:</p>
              <div className="bg-primary text-accent-dark rounded-xl px-6 py-3 font-bold text-xl tracking-widest mx-auto w-fit mb-4">
                🎀 {codigo}
              </div>
              <p className="text-sm text-text-medium">
                Revisa tu correo con los datos de acceso para rastrear tus pedidos.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <Image src="/logo.png" alt="La Dulcería" width={80} height={80} className="rounded-full mx-auto mb-3" />
                <h2 className="font-serif text-2xl text-text-dark mb-1">
                  ¡Bienvenida!
                </h2>
                <p className="text-text-medium text-sm">
                  Regístrate ahora y obtén{' '}
                  <span className="text-accent font-bold">{descuento}% OFF</span>{' '}
                  en tu primer pedido
                </p>
              </div>

              {/* Código destacado */}
              <div className="bg-primary text-accent-dark rounded-xl px-4 py-2.5 font-bold text-center text-base tracking-widest mb-6">
                🎀 {codigo} — {descuento}% OFF tu primer pedido
              </div>

              <form onSubmit={handleRegistrar} className="space-y-3">
                <div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tu nombre *"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Tu correo electrónico *"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="WhatsApp (opcional)"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>

                <p className="text-[10px] text-text-light leading-relaxed">
                  Al registrarte autorizas el tratamiento de tus datos personales conforme a la{' '}
                  <strong>Ley 1581 de 2012</strong> (Colombia) para gestionar tu cuenta y enviarte
                  información comercial. Escríbenos a <strong>hola@ladulceria.co</strong> para
                  ejercer tus derechos de acceso, rectificación o supresión.
                </p>

                {error && (
                  <p className="text-dulce-red text-xs font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-accent text-white py-3 rounded-full font-bold hover:bg-accent-dark transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
                >
                  {enviando ? 'Registrando...' : `¡Quiero mi ${descuento}% de descuento! 🎁`}
                </button>
              </form>

              <button
                onClick={cerrar}
                className="w-full text-center text-xs text-text-light hover:text-text-medium mt-3 py-1 transition-colors"
              >
                No gracias, prefiero pagar precio completo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
