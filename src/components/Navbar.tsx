'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const { data: session } = useSession()
  const { estado } = useCart()
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      <nav
        id="navbar"
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-card"
        style={{ transition: '0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="La Dulcería tienda de regalos"
              width={52}
              height={52}
              className="rounded-full"
              priority
            />
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex gap-7 ml-8 flex-1">
            {[
              { href: '/', label: 'Inicio' },
              { href: '/catalogo', label: 'Catálogo' },
              { href: '/#resenas', label: 'Reseñas' },
              { href: '/#contacto', label: 'Contacto' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-text-medium hover:text-accent relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Carrito */}
            <Link
              href="/carrito"
              className="relative text-accent text-2xl flex items-center gap-1"
              aria-label="Ver carrito"
            >
              🛒
              {estado.cantidad > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-dulce-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {estado.cantidad}
                </span>
              )}
            </Link>

            {/* Auth */}
            {session ? (
              <div className="hidden md:flex items-center gap-2">
                {(session.user as any)?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="text-xs font-bold text-accent-dark bg-primary px-3 py-1 rounded-full hover:bg-primary-dark transition-colors"
                  >
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/cuenta"
                    className="text-sm font-semibold text-text-medium hover:text-accent transition-colors"
                  >
                    Mi cuenta
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-semibold text-text-light hover:text-dulce-red transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block bg-accent text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-accent-dark transition-all hover:-translate-y-px"
              >
                Ingresar
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-1"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <span className="block w-6 h-0.5 bg-accent rounded" />
              <span className="block w-6 h-0.5 bg-accent rounded" />
              <span className="block w-6 h-0.5 bg-accent rounded" />
            </button>
          </div>
        </div>
      </nav>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 bg-white z-[600] flex flex-col items-center justify-center gap-8">
          <button
            className="absolute top-6 right-6 text-3xl text-text-medium"
            onClick={() => setMenuAbierto(false)}
          >
            ✕
          </button>
          <Image src="/logo.png" alt="La Dulcería" width={80} height={80} className="rounded-full" />
          {[
            { href: '/', label: 'Inicio' },
            { href: '/catalogo', label: 'Catálogo' },
            { href: '/#resenas', label: 'Reseñas' },
            { href: '/#contacto', label: 'Contacto' },
            { href: '/carrito', label: 'Carrito 🛒' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-serif text-3xl text-text-dark hover:text-accent transition-colors"
              onClick={() => setMenuAbierto(false)}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <>
              {(session.user as any)?.role !== 'admin' && (
                <Link
                  href="/cuenta"
                  className="font-serif text-2xl text-text-medium"
                  onClick={() => setMenuAbierto(false)}
                >
                  Mi cuenta
                </Link>
              )}
              <button
                onClick={() => {
                  setMenuAbierto(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="text-lg text-text-light hover:text-dulce-red"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold text-lg"
              onClick={() => setMenuAbierto(false)}
            >
              Ingresar
            </Link>
          )}
        </div>
      )}
    </>
  )
}
