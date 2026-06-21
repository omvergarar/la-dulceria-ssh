import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export const metadata = {
  title: 'Panel Admin — La Dulcería tienda de regalos',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Solo el administrador puede acceder
  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/login?callbackUrl=/admin')
  }

  return (
    <div className="min-h-screen bg-bg-soft flex flex-col">
      {/* Header admin */}
      <header className="bg-accent text-white px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-md">
        <h1 className="font-serif text-xl font-bold">La Dulcería tienda de regalos — Admin</h1>
        <span className="text-white/80 text-sm">⚙️ {session.user?.email}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
