'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const MENU = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/estadisticas', label: 'Estadísticas', icon: '📈' },
  { href: '/admin/productos', label: 'Productos', icon: '🎁' },
  { href: '/admin/categorias', label: 'Categorías', icon: '🏷️' },
  { href: '/admin/ordenes', label: 'Órdenes', icon: '📦' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/cupones', label: 'Cupones', icon: '🎟️' },
  { href: '/admin/resenas', label: 'Reseñas', icon: '⭐' },
  { href: '/admin/carrusel', label: 'Carrusel', icon: '🖼️' },
  { href: '/admin/temas', label: 'Temas', icon: '🎨' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 md:w-52 bg-white border-r-2 border-primary-dark flex-shrink-0 flex flex-col py-4">
      {MENU.map((item) => {
        const activo = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activo
                ? 'bg-primary text-accent-dark border-r-4 border-accent'
                : 'text-text-medium hover:bg-bg-soft hover:text-accent'
            }`}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span className="hidden md:block">{item.label}</span>
          </Link>
        )
      })}

      <div className="mt-auto px-4 py-3 border-t border-primary-dark">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 text-sm font-semibold text-text-light hover:text-dulce-red transition-colors w-full"
        >
          <span className="text-xl">🚪</span>
          <span className="hidden md:block">Salir</span>
        </button>
      </div>
    </aside>
  )
}
