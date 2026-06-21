'use client'

import { useState } from 'react'

interface Tema {
  id?: number
  nombre: string
  primary: string
  primaryDark: string
  primaryDeeper: string
  accent: string
  accentDark: string
  textDark: string
  creadoEn?: string | null
}

const PRESETS: Tema[] = [
  { nombre: '💜 Original',        primary:'#fbddf9', primaryDark:'#f5bef2', primaryDeeper:'#e89ee4', accent:'#c96bc4', accentDark:'#a3509e', textDark:'#2d1a2b' },
  { nombre: '🎄 Navidad',         primary:'#fce8e8', primaryDark:'#f5c6c6', primaryDeeper:'#e89393', accent:'#c0392b', accentDark:'#922b21', textDark:'#2c1010' },
  { nombre: '🎃 Halloween',       primary:'#fdebd0', primaryDark:'#fad7a0', primaryDeeper:'#f5b77e', accent:'#e67e22', accentDark:'#ca6f1e', textDark:'#1c1009' },
  { nombre: '💛 Día de la Madre', primary:'#fefde7', primaryDark:'#fdf9c0', primaryDeeper:'#fbf395', accent:'#d4ac0d', accentDark:'#a58909', textDark:'#2a2100' },
  { nombre: '💝 San Valentín',    primary:'#fde8ef', primaryDark:'#fcc6d8', primaryDeeper:'#f99dbc', accent:'#e91e6b', accentDark:'#b5154f', textDark:'#2a0018' },
  { nombre: '🌊 Verano',          primary:'#e0f7fa', primaryDark:'#b2ebf2', primaryDeeper:'#80deea', accent:'#0097a7', accentDark:'#00838f', textDark:'#002022' },
  { nombre: '🍂 Otoño',           primary:'#fbe9e7', primaryDark:'#ffccbc', primaryDeeper:'#ffab91', accent:'#bf360c', accentDark:'#870000', textDark:'#1c0800' },
  { nombre: '🌿 Eco',             primary:'#e8f5e9', primaryDark:'#c8e6c9', primaryDeeper:'#a5d6a7', accent:'#2e7d32', accentDark:'#1b5e20', textDark:'#0a1f0a' },
]

const CAMPOS: { key: keyof Tema; label: string }[] = [
  { key: 'primary',       label: 'Primario' },
  { key: 'primaryDark',   label: 'Primario oscuro' },
  { key: 'primaryDeeper', label: 'Primario profundo' },
  { key: 'accent',        label: 'Acento' },
  { key: 'accentDark',    label: 'Acento oscuro' },
  { key: 'textDark',      label: 'Texto oscuro' },
]

function aplicarCSSVars(t: Tema) {
  const r = document.documentElement.style
  r.setProperty('--primary', t.primary)
  r.setProperty('--primary-dark', t.primaryDark)
  r.setProperty('--primary-deeper', t.primaryDeeper)
  r.setProperty('--accent', t.accent)
  r.setProperty('--accent-dark', t.accentDark)
  r.setProperty('--text-dark', t.textDark)
}

export default function TemasAdminClient({
  temaActivoInicial,
  temasGuardados: temasIniciales,
}: {
  temaActivoInicial: Tema | null
  temasGuardados: Tema[]
}) {
  const defaultTema: Tema = temaActivoInicial ?? PRESETS[0]
  const [editor, setEditor] = useState<Tema>({ ...defaultTema })
  const [temas, setTemas] = useState<Tema[]>(temasIniciales)
  const [guardando, setGuardando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [exito, setExito] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')

  function actualizarColor(key: keyof Tema, valor: string) {
    const nuevo = { ...editor, [key]: valor }
    setEditor(nuevo)
    aplicarCSSVars(nuevo) // preview en tiempo real
  }

  function seleccionarPreset(preset: Tema) {
    setEditor({ ...preset })
    aplicarCSSVars(preset)
  }

  async function aplicarTema(tema: Tema) {
    setAplicando(true)
    await fetch('/api/admin/tema-activo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tema),
    })
    aplicarCSSVars(tema)
    setEditor({ ...tema })
    setExito('✓ Tema aplicado a la tienda')
    setTimeout(() => setExito(''), 3000)
    setAplicando(false)
  }

  async function guardarTema() {
    if (!nombreNuevo.trim()) return
    setGuardando(true)
    const res = await fetch('/api/admin/temas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editor, nombre: nombreNuevo.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setTemas([data, ...temas])
      setNombreNuevo('')
      setExito('✓ Tema guardado')
      setTimeout(() => setExito(''), 3000)
    }
    setGuardando(false)
  }

  async function eliminarTema(id: number) {
    if (!confirm('¿Eliminar este tema?')) return
    await fetch(`/api/admin/temas/${id}`, { method: 'DELETE' })
    setTemas(temas.filter((t) => t.id !== id))
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-serif text-2xl text-text-dark mb-8">🎨 Temas de color</h2>

      {/* ── PRESETS ── */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="font-serif text-lg text-text-dark mb-4 pb-3 border-b-2 border-primary-dark">
          Temas de temporada
        </h3>
        <div className="flex gap-2 flex-wrap mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.nombre}
              onClick={() => seleccionarPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-transparent hover:border-accent transition-all"
              style={{ background: p.primary, color: p.textDark }}
            >
              {p.nombre}
            </button>
          ))}
        </div>

        {/* ── EDITOR DE COLORES ── */}
        <h4 className="font-semibold text-text-dark text-sm mb-3">Personalizar colores</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {CAMPOS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={editor[key] as string}
                onChange={(e) => actualizarColor(key, e.target.value)}
                className="w-9 h-8 rounded cursor-pointer border-none flex-shrink-0"
              />
              <input
                type="text"
                value={editor[key] as string}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                    actualizarColor(key, e.target.value)
                }}
                className="w-24 px-2 py-1 border-2 border-primary-dark rounded text-xs font-mono focus:border-accent focus:outline-none"
                maxLength={7}
              />
              <label className="text-xs text-text-medium flex-1">{label}</label>
            </div>
          ))}
        </div>

        {/* Vista previa */}
        <div className="rounded-xl p-4 mb-5 flex gap-3 flex-wrap items-center"
          style={{ background: editor.primary }}>
          <span className="text-sm font-semibold" style={{ color: editor.textDark }}>Vista previa →</span>
          <span className="px-4 py-1.5 rounded-full text-white text-xs font-bold"
            style={{ background: editor.accent }}>Botón acento</span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold"
            style={{ background: editor.primaryDark, color: editor.textDark }}>Fondo suave</span>
          <span className="w-6 h-6 rounded-full border-2 border-white"
            style={{ background: editor.accentDark }} title="Acento oscuro" />
        </div>

        {/* Aplicar a la tienda */}
        <div className="flex gap-3 flex-wrap items-center">
          <button
            onClick={() => aplicarTema(editor)}
            disabled={aplicando}
            className="bg-accent text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-accent-dark transition-all disabled:opacity-60"
          >
            {aplicando ? 'Aplicando...' : '✨ Aplicar a la tienda ahora'}
          </button>
          {exito && <span className="text-dulce-green text-sm font-semibold">{exito}</span>}
        </div>
      </div>

      {/* ── GUARDAR COMO NUEVO TEMA ── */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="font-serif text-lg text-text-dark mb-4 pb-3 border-b-2 border-primary-dark">
          Guardar combinación actual
        </h3>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            className="form-input flex-1"
            placeholder="Ej: Navidad 2025"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardarTema()}
          />
          <button
            onClick={guardarTema}
            disabled={guardando || !nombreNuevo.trim()}
            className="bg-accent text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-accent-dark transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {guardando ? 'Guardando...' : '+ Guardar tema'}
          </button>
        </div>
      </div>

      {/* ── TEMAS GUARDADOS ── */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-serif text-lg text-text-dark mb-4 pb-3 border-b-2 border-primary-dark">
          Temas guardados ({temas.length})
        </h3>
        {temas.length === 0 ? (
          <p className="text-text-light text-sm">No hay temas guardados todavía.</p>
        ) : (
          <div className="space-y-3">
            {temas.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-bg-soft rounded-xl">
                {/* Swatches */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {[t.primary, t.accent, t.textDark].map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-white/50 shadow-sm"
                      style={{ background: c }} />
                  ))}
                </div>
                <span className="flex-1 font-semibold text-sm text-text-dark">{t.nombre}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => aplicarTema(t)}
                    className="bg-accent text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-accent-dark transition-colors"
                  >
                    ✨ Usar
                  </button>
                  <button
                    onClick={() => seleccionarPreset(t)}
                    className="bg-bg-soft border border-primary-dark text-text-medium px-3 py-1 rounded-lg text-xs font-bold hover:bg-primary hover:text-accent-dark transition-colors"
                  >
                    Editar
                  </button>
                  {t.id && (
                    <button
                      onClick={() => eliminarTema(t.id!)}
                      className="bg-bg-soft border border-primary-dark text-text-medium px-3 py-1 rounded-lg text-xs font-bold hover:bg-dulce-red hover:text-white hover:border-dulce-red transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
