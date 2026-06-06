// Integración con Wompi Colombia — https://docs.wompi.co/
// Wompi usa un widget embebido + webhook para confirmar pagos

export interface WompiTransaccion {
  referencia: string
  monto: number      // en centavos COP
  moneda: 'COP'
  descripcion: string
  emailCliente: string
  nombreCliente: string
  telefonoCliente?: string
  urlRedireccion: string
}

// Genera la firma de integridad requerida por Wompi
export async function generarFirmaWompi(
  referencia: string,
  monto: number,
  moneda: string
): Promise<string> {
  const secreto = process.env.WOMPI_EVENTS_SECRET!
  const cadena = `${referencia}${monto}${moneda}${secreto}`

  // SHA256 usando Web Crypto API (disponible en Edge Runtime y Node.js 18+)
  const encoder = new TextEncoder()
  const data = encoder.encode(cadena)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Verifica el estado de una transacción con la API de Wompi
export async function verificarTransaccionWompi(referencia: string) {
  const llavePrivada = process.env.WOMPI_PRIVATE_KEY!
  const baseUrl = 'https://production.wompi.co/v1'

  const response = await fetch(`${baseUrl}/transactions?reference=${referencia}`, {
    headers: {
      Authorization: `Bearer ${llavePrivada}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Error al verificar transacción Wompi: ${response.status}`)
  }

  const data = await response.json()
  return data.data?.[0] ?? null
}

// Formatea monto a centavos (Wompi requiere centavos COP)
export function copACentavos(cop: number): number {
  return Math.round(cop * 100)
}

// Formatea monto de centavos a COP para mostrar
export function centavosACop(centavos: number): number {
  return centavos / 100
}
