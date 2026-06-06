'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'

interface Stats {
  categorias: number
  productos: number
  promedio: number
  resenas: number
}

interface Producto {
  id: number
  nombre: string
  precio: number
  stock: number
  categoria: string
  imagenUrl: string | null
  descripcion: string
}

interface ResenaPublica {
  id: number
  nombre: string
  ciudad: string
  texto: string
  estrellas: number
}

interface Props {
  stats: Stats
  productosDestacados: Producto[]
  resenasAprobadas: ResenaPublica[]
}

const POR_PAGINA_RESENAS = 3

export default function LandingClient({ stats, productosDestacados, resenasAprobadas }: Props) {
  const [paginaResenas, setPaginaResenas] = useState(0)
  const totalPaginasResenas = Math.ceil(resenasAprobadas.length / POR_PAGINA_RESENAS)
  const resenasPagina = resenasAprobadas.slice(
    paginaResenas * POR_PAGINA_RESENAS,
    paginaResenas * POR_PAGINA_RESENAS + POR_PAGINA_RESENAS
  )
  const [resenaEnviada, setResenaEnviada] = useState(false)
  const [resenaForm, setResenaForm] = useState({ nombre: '', estrellas: 5, comentario: '' })
  const [contactoEnviado, setContactoEnviado] = useState(false)
  const [contactoForm, setContactoForm] = useState({ nombre: '', contacto: '', tipo: '', mensaje: '' })

  // Animación fade-in al hacer scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  async function handleResena(e: React.FormEvent) {
    e.preventDefault()
    if (!resenaForm.nombre || !resenaForm.comentario) return
    await fetch('/api/resenas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: resenaForm.nombre,
        texto: resenaForm.comentario,
        estrellas: resenaForm.estrellas,
      }),
    })
    setResenaEnviada(true)
  }

  function handleContacto(e: React.FormEvent) {
    e.preventDefault()
    setContactoEnviado(true)
  }

  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000'

  return (
    <>
      {/* === HERO === */}
      <section
        id="inicio"
        className="min-h-[90vh] flex items-center relative overflow-hidden px-6 py-24"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #fbddf9 0%, #fffaff 70%)' }}
      >
        {/* Decoraciones flotantes */}
        <div className="absolute rounded-full opacity-35 pointer-events-none"
          style={{ width: 320, height: 320, background: '#e89ee4', top: -80, right: -60, animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 180, height: 180, background: '#c96bc4', opacity: 0.15, bottom: 60, left: -40, animation: 'float 8s ease-in-out infinite 1s' }} />
        <div className="absolute rounded-full opacity-35 pointer-events-none"
          style={{ width: 100, height: 100, background: '#f5bef2', top: '40%', left: '55%', animation: 'float 7s ease-in-out infinite 2s' }} />

        <div className="max-w-[1280px] mx-auto w-full relative z-10">
          <div className="fade-in text-center">
            <span className="inline-block bg-primary-dark text-accent-dark text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide">
              ✨ Regalos únicos en Colombia
            </span>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight text-text-dark mb-5 max-w-3xl mx-auto">
              El regalo perfecto<br />
              nace en <em className="text-accent not-italic">La Dulcería tienda de regalos</em>
            </h1>
            <div className="max-w-2xl mx-auto mb-8 space-y-3 text-text-medium leading-relaxed">
              <p className="text-xl font-serif font-semibold text-text-dark">
                Más que regalos, creamos emociones que perduran.
              </p>
              <p className="text-base">
                Lo que comenzó como un sueño lleno de ilusión, hoy se ha convertido en un espacio
                donde cada detalle cuenta una historia.
              </p>
              <p className="text-base">
                Cada caja, cada diseño y cada creación lleva dedicación, amor y el deseo de hacer
                sonreír a alguien especial.
              </p>
              <p className="text-base font-semibold text-accent">
                Bienvenidos a un lugar donde los detalles se convierten en recuerdos inolvidables.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
              <a
                href={`https://wa.me/${numero}?text=Hola!%20Vi%20su%20cat%C3%A1logo%20en%20La%20Dulcer%C3%ADa%20tienda%20de%20regalos%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20%F0%9F%8C%B8`}
                target="_blank" rel="noopener noreferrer" className="btn-outline"
              >
                Hablar por WhatsApp
              </a>
            </div>

            {/* Estadísticas */}
            <div className="flex gap-10 mt-12 flex-wrap justify-center">
              {[
                { num: stats.categorias, label: 'Categorías' },
                { num: stats.productos, label: 'Productos' },
                { num: stats.promedio, label: '⭐ Promedio' },
                { num: stats.resenas, label: 'Reseñas' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <span className="font-serif text-3xl font-bold text-accent block">{s.num}</span>
                  <span className="text-xs text-text-light font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === CARACTERÍSTICAS === */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="section-header fade-in">
          <h2>¿Por qué elegirnos?</h2>
        </div>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🎁', titulo: 'Empaques únicos', desc: 'Cada regalo viene en un empaque especial, pensado con amor y atención al detalle.' },
            { icon: '🚀', titulo: 'Envío rápido', desc: 'Entrega en Bogotá y área metropolitana. Puntualidad garantizada para tu ocasión especial.' },
            { icon: '💝', titulo: 'Personalización total', desc: 'Agrega tu mensaje especial a cada regalo. Lo hacemos único para ti.' },
            { icon: '🌸', titulo: 'Productos frescos', desc: 'Trabajamos con proveedores locales para garantizar la mejor calidad en cada pedido.' },
          ].map((f) => (
            <div key={f.titulo}
              className="fade-in bg-bg-soft rounded-xl p-8 text-center border border-primary-dark hover:-translate-y-1.5 hover:shadow-hover transition-all duration-300">
              <span className="text-4xl block mb-4">{f.icon}</span>
              <h3 className="font-serif text-lg text-text-dark mb-2">{f.titulo}</h3>
              <p className="text-sm text-text-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === PRODUCTOS DESTACADOS === */}
      {productosDestacados.length > 0 && (
        <section id="destacados" className="py-20 px-6 bg-bg-soft">
          <div className="max-w-[1280px] mx-auto">
            <div className="section-header fade-in">
              <h2>Nuestros Favoritos 🎀</h2>
              <p>Los regalos más amados por nuestra clientela</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {productosDestacados.map((p) => (
                <div key={p.id} className="fade-in"><ProductCard {...p} /></div>
              ))}
            </div>
            <div className="text-center mt-10 fade-in">
              <Link href="/catalogo" className="btn-primary">Ver catálogo completo →</Link>
            </div>
          </div>
        </section>
      )}

      {/* === RESEÑAS === */}
      <section id="resenas" className="py-20 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="section-header fade-in">
            <h2>Lo que dicen nuestros clientes 💜</h2>
            <p>Reseñas reales de personas que eligieron regalar con amor</p>
          </div>
          {resenasAprobadas.length > 0 && (
            <div className="mb-16">
              {/* Grid de reseñas — página actual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 min-h-[180px]">
                {resenasPagina.map((r) => (
                  <div key={r.id}
                    className="fade-in bg-bg-soft rounded-xl p-6 border-l-4 border-accent hover:shadow-hover transition-all duration-300">
                    <div className="text-dulce-yellow text-lg mb-3">{'★'.repeat(r.estrellas)}</div>
                    <p className="text-text-medium italic mb-4 leading-relaxed text-sm">"{r.texto}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-serif font-bold text-base flex-shrink-0">
                        {r.nombre[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-text-dark text-sm">{r.nombre}</span>
                        <small className="block text-text-light text-xs mt-0.5">{r.ciudad}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles del carrusel */}
              {totalPaginasResenas > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPaginaResenas((p) => Math.max(0, p - 1))}
                    disabled={paginaResenas === 0}
                    className="w-9 h-9 rounded-full bg-white border-2 border-primary-dark text-accent font-bold flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-card"
                    aria-label="Anteriores"
                  >‹</button>

                  {/* Puntos indicadores */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPaginasResenas }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPaginaResenas(i)}
                        className={`rounded-full transition-all ${i === paginaResenas ? 'w-6 h-2.5 bg-accent' : 'w-2.5 h-2.5 bg-primary-deeper hover:bg-accent'}`}
                        aria-label={`Página ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setPaginaResenas((p) => Math.min(totalPaginasResenas - 1, p + 1))}
                    disabled={paginaResenas === totalPaginasResenas - 1}
                    className="w-9 h-9 rounded-full bg-white border-2 border-primary-dark text-accent font-bold flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-card"
                    aria-label="Siguientes"
                  >›</button>
                </div>
              )}
            </div>
          )}

          {/* Formulario de reseña */}
          <div className="bg-bg-soft rounded-xl p-10 max-w-xl mx-auto shadow-card fade-in">
            <h3 className="font-serif text-2xl text-text-dark mb-6 text-center">Déjanos tu reseña ⭐</h3>
            {resenaEnviada ? (
              <div className="text-center py-8">
                <span className="text-5xl block mb-4">🌸</span>
                <h4 className="font-serif text-xl text-text-dark mb-2">¡Gracias por tu reseña!</h4>
                <p className="text-text-medium">Será revisada y publicada pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleResena} className="space-y-4">
                <div>
                  <label className="form-label">Tu nombre</label>
                  <input type="text" className="form-input" placeholder="¿Cómo te llamas?"
                    value={resenaForm.nombre}
                    onChange={(e) => setResenaForm({ ...resenaForm, nombre: e.target.value })}
                    required />
                </div>
                <div>
                  <label className="form-label">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button"
                        onClick={() => setResenaForm({ ...resenaForm, estrellas: n })}
                        className={`text-2xl transition-transform hover:scale-110 ${n <= resenaForm.estrellas ? 'text-dulce-yellow' : 'text-gray-300'}`}>★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Tu comentario</label>
                  <textarea className="form-input resize-none h-24"
                    placeholder="Cuéntanos tu experiencia (mín. 10 caracteres)"
                    value={resenaForm.comentario}
                    onChange={(e) => setResenaForm({ ...resenaForm, comentario: e.target.value })}
                    minLength={10} required />
                </div>
                <button type="submit" className="w-full bg-accent text-white py-3 rounded-lg font-bold hover:bg-accent-dark transition-colors">
                  Enviar reseña 💌
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* === CONTACTO === */}
      <section id="contacto" className="py-20 px-6 bg-bg-soft">
        <div className="max-w-lg mx-auto">
          <div className="section-header fade-in mb-8">
            <h2>Contáctanos 💬</h2>
          </div>
          <div className="fade-in bg-white rounded-xl p-8 shadow-card">
            {contactoEnviado ? (
              <div className="text-center py-8">
                <span className="text-5xl block mb-4">✅</span>
                <h4 className="font-serif text-xl text-text-dark mb-2">¡Mensaje enviado!</h4>
                <p className="text-text-medium">Te responderemos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleContacto} className="space-y-4">
                <div>
                  <label className="form-label">Nombre</label>
                  <input type="text" className="form-input" placeholder="Tu nombre"
                    value={contactoForm.nombre}
                    onChange={(e) => setContactoForm({ ...contactoForm, nombre: e.target.value })}
                    required />
                </div>
                <div>
                  <label className="form-label">Teléfono o correo</label>
                  <input type="text" className="form-input" placeholder="¿Cómo te contactamos?"
                    value={contactoForm.contacto}
                    onChange={(e) => setContactoForm({ ...contactoForm, contacto: e.target.value })}
                    required />
                </div>
                <div>
                  <label className="form-label">Tipo de consulta</label>
                  <select className="form-input" value={contactoForm.tipo}
                    onChange={(e) => setContactoForm({ ...contactoForm, tipo: e.target.value })}
                    required>
                    <option value="">Selecciona...</option>
                    <option>Pedido personalizado</option>
                    <option>Información de envíos</option>
                    <option>Precios y disponibilidad</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Mensaje</label>
                  <textarea className="form-input resize-none h-24" placeholder="Escríbenos..."
                    value={contactoForm.mensaje}
                    onChange={(e) => setContactoForm({ ...contactoForm, mensaje: e.target.value })}
                    required />
                </div>
                <p className="text-[11px] text-text-light leading-relaxed">
                  Al enviar este formulario autorizas a <strong>La Dulcería tienda de regalos</strong> el
                  tratamiento de tus datos personales con la finalidad de atender tu consulta, conforme a la{' '}
                  <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013 (Colombia). Puedes ejercer tus
                  derechos de acceso, rectificación y supresión escribiéndonos a{' '}
                  <strong>hola@ladulceria.co</strong>.
                </p>
                <button type="submit" className="w-full bg-accent text-white py-3 rounded-lg font-bold hover:bg-accent-dark transition-colors">
                  Enviar mensaje 💌
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* === REGISTRO CTA === */}
      <section id="registrate" className="py-20 px-6"
        style={{ background: 'linear-gradient(135deg, #fbddf9 0%, #f5bef2 100%)' }}>
        <div className="max-w-sm mx-auto text-center fade-in">
          <h2 className="font-serif text-3xl text-text-dark mb-3">
            ¿Quieres recibir ofertas exclusivas? 🌸
          </h2>
          <p className="text-text-medium mb-8">Regístrate y recibe tu código de descuento especial</p>
          <Link href="/registro"
            className="inline-block bg-accent text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-accent-dark transition-all hover:-translate-y-0.5 shadow-soft">
            Registrarme
          </Link>
        </div>
      </section>
    </>
  )
}
