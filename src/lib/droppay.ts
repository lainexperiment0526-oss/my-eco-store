export type DroppayCreateParams = {
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, any>
}

export type DroppayCreateResponse = {
  success: boolean
  payment: any
  error?: string
}

export async function createDroppayPayment(params: DroppayCreateParams): Promise<DroppayCreateResponse> {
  const r = await fetch('/droppay/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  const text = await r.text()
  if (!r.ok) {
    return { success: false, payment: null, error: text }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { success: true, payment: { raw: text } }
  }
}

export async function createDroppayPaymentViaApi(params: DroppayCreateParams): Promise<DroppayCreateResponse> {
  const r = await fetch('/api/droppay-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  const text = await r.text()
  if (!r.ok) {
    return { success: false, payment: null, error: text }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { success: true, payment: { raw: text } }
  }
}
