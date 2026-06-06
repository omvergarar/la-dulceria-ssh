'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/clientes/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.toLowerCase().trim(),
          telefono: form.telefono.trim(),
          password: form.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrar. Intenta de nuevo.')
        return
      }

      // Auto-login después del registro
      await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })
      router.push('/cuenta')
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-cream flex items-center justify-center px-6 py-16">
      <div
        className="w-full max-w-md bg-white rounded-xl p-10 shadow-card"
        style={{ animation: 'popIn 0.3s ease-out' }}
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logo.png" alt="La Dulcería tienda de regalos" width={90} height={90} className="rounded-full mx-auto" />
          </Link>
          <h1 className="font-serif text-2xl text-text-dark">Crea tu cuenta</h1>
          <p className="text-text-medium text-sm mt-1">
            Regístrate y recibe{' '}
            <span className="text-accent font-semibold">15% OFF</span> en tu primer pedido
          </p>
        </div>

        {/* Código de descuento */}
        <div className="bg-primary text-accent-dark rounded-xl p-3 text-center font-bold text-base mb-6 tracking-wider">
          🎀 DULCE15 — 15% OFF tu primer pedido
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nombre completo</label>
            <input
              type="text"
              className="form-input"
              placeholder="María García"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">WhatsApp (opcional)</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+57 300 000 0000"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="form-label">Confirmar contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-dulce-red text-sm">
              {error}
            </div>
          )}

          <p className="text-[11px] text-text-light leading-relaxed">
            Al registrarte autorizas a <strong>La Dulcería tienda de regalos</strong> el tratamiento
            de tus datos personales para gestionar tu cuenta, procesar pedidos y enviarte información
            comercial, conforme a la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013
            (Colombia). Puedes ejercer tus derechos de acceso, rectificación y supresión
            escribiéndonos a <strong>hola@ladulceria.co</strong>.
          </p>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-accent text-white py-3.5 rounded-full font-bold text-base hover:bg-accent-dark transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {cargando ? 'Registrando...' : 'Registrarme 🎀'}
          </button>
        </form>

        <p className="text-center text-sm text-text-medium mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
