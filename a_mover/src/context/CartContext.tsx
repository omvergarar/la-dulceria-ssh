'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export interface ItemCarrito {
  id: number
  nombre: string
  precio: number
  imagenUrl: string | null
  cantidad: number
  mensaje?: string
}

interface EstadoCarrito {
  items: ItemCarrito[]
  total: number
  cantidad: number
}

type AccionCarrito =
  | { type: 'AGREGAR'; payload: Omit<ItemCarrito, 'cantidad'> }
  | { type: 'QUITAR'; payload: { id: number } }
  | { type: 'ACTUALIZAR_CANTIDAD'; payload: { id: number; cantidad: number } }
  | { type: 'ACTUALIZAR_MENSAJE'; payload: { id: number; mensaje: string } }
  | { type: 'VACIAR' }
  | { type: 'CARGAR'; payload: ItemCarrito[] }

function calcularTotales(items: ItemCarrito[]) {
  return {
    total: items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    cantidad: items.reduce((sum, item) => sum + item.cantidad, 0),
  }
}

function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'AGREGAR': {
      const existente = estado.items.find((i) => i.id === accion.payload.id)
      let items: ItemCarrito[]
      if (existente) {
        items = estado.items.map((i) =>
          i.id === accion.payload.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      } else {
        items = [...estado.items, { ...accion.payload, cantidad: 1 }]
      }
      return { items, ...calcularTotales(items) }
    }
    case 'QUITAR': {
      const items = estado.items.filter((i) => i.id !== accion.payload.id)
      return { items, ...calcularTotales(items) }
    }
    case 'ACTUALIZAR_CANTIDAD': {
      const items =
        accion.payload.cantidad <= 0
          ? estado.items.filter((i) => i.id !== accion.payload.id)
          : estado.items.map((i) =>
              i.id === accion.payload.id ? { ...i, cantidad: accion.payload.cantidad } : i
            )
      return { items, ...calcularTotales(items) }
    }
    case 'ACTUALIZAR_MENSAJE': {
      const items = estado.items.map((i) =>
        i.id === accion.payload.id ? { ...i, mensaje: accion.payload.mensaje } : i
      )
      return { items, ...calcularTotales(items) }
    }
    case 'VACIAR':
      return { items: [], total: 0, cantidad: 0 }
    case 'CARGAR': {
      const items = accion.payload
      return { items, ...calcularTotales(items) }
    }
    default:
      return estado
  }
}

const STORAGE_KEY = 'ladulceria_carrito'

const CartContext = createContext<{
  estado: EstadoCarrito
  agregarItem: (item: Omit<ItemCarrito, 'cantidad'>) => void
  quitarItem: (id: number) => void
  actualizarCantidad: (id: number, cantidad: number) => void
  actualizarMensaje: (id: number, mensaje: string) => void
  vaciarCarrito: () => void
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(carritoReducer, { items: [], total: 0, cantidad: 0 })

  // Cargar carrito guardado al iniciar
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) {
        dispatch({ type: 'CARGAR', payload: JSON.parse(guardado) })
      }
    } catch {}
  }, [])

  // Persistir carrito en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado.items))
  }, [estado.items])

  return (
    <CartContext.Provider
      value={{
        estado,
        agregarItem: (item) => dispatch({ type: 'AGREGAR', payload: item }),
        quitarItem: (id) => dispatch({ type: 'QUITAR', payload: { id } }),
        actualizarCantidad: (id, cantidad) =>
          dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { id, cantidad } }),
        actualizarMensaje: (id, mensaje) =>
          dispatch({ type: 'ACTUALIZAR_MENSAJE', payload: { id, mensaje } }),
        vaciarCarrito: () => dispatch({ type: 'VACIAR' }),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
