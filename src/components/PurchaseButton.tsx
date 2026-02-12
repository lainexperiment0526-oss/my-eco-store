import React from 'react'
import { createDroppayPaymentViaApi } from '../lib/droppay'

type Props = {
  amount: number
  productId: string
  profileId: string
  description?: string
  productTitle?: string
  downloadUrl?: string
}

export function PurchaseButton({ amount, productId, profileId, description, productTitle, downloadUrl }: Props) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handlePurchase() {
    setLoading(true)
    setError(null)
    const resp = await createDroppayPaymentViaApi({
      amount,
      currency: 'PI',
      description: description || 'Purchase',
      metadata: {
        product_id: productId,
        profile_id: profileId,
        payment_type: 'product',
        description,
        product_title: productTitle,
        download_url: downloadUrl,
      },
    })
    setLoading(false)
    if (!resp.success) {
      setError(resp.error || 'Payment initialization failed')
      return
    }
    const p = resp.payment
    const url = p?.checkout_url || p?.url || p?.payment_url || p?.payment?.checkout_url
    if (url) {
      window.location.href = url
    } else {
      setError('Missing checkout URL in response')
    }
  }

  return (
    <button onClick={handlePurchase} disabled={loading} className="inline-flex items-center rounded-md border px-4 py-2 text-sm">
      {loading ? 'Initializing…' : 'Buy Now'}
    </button>
  )
}
