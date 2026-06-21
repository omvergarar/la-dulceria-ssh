'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const res = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        redirect: false,
      })

      if (res?.error) {
        setError('Correo o contraseña incorrectos. Verifica tus datos.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
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
        {/* Encabezado */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            <Image src="/logo.png" alt="La Dulcería tienda de regalos" width={90} height={90} className="rounded-full mx-auto" />
          </Link>
          <h1 className="font-serif text-2xl text-text-dark">Bienvenida de vuelta</h1>
          <p className="text-text-medium text-sm mt-1">Ingresa a tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-dulce-red text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-accent text-white py-3.5 rounded-full font-bold text-base hover:bg-accent-dark transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {cargando ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>

        <p className="text-center text-sm text-text-medium mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-accent font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
        <p className="text-center text-xs text-text-light mt-3">
          ¿Eres administrador?{' '}
          <Link href="/login" className="text-text-light hover:text-accent">
            Usar credenciales de admin
          </Link>
        </p>
      </div>
    </div>
  )
}
