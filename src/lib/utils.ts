// Utilidades generales de La Dulcería

export function formatearPrecio(valor: number | string | { toNumber?: () => number }): string {
  const num = typeof valor === 'object' && valor?.toNumber
    ? valor.toNumber()
    : Number(valor)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatearFecha(fecha: Date | string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha))
}

export const CATEGORIAS = [
  'Cajas de Regalo',
  'Desayunos Sorpresa',
  'Velas Aromáticas',
  'Peluches y Flores',
  'Chocolates y Dulces',
  'Kits Especiales',
  'Personalizados',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export const ESTADOS_ORDEN = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  pagado: { label: 'Pagado', color: 'bg-blue-100 text-blue-800' },
  enviado: { label: 'Enviado', color: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
} as const

export const ENVIO_GRATIS_DESDE = 120000 // COP
