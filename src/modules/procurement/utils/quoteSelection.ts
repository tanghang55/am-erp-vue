import type { ProductSupplierQuote } from '@/modules/supplier/types'
import type { DraftItem } from '@/modules/procurement/utils/productSelection'

export type QuoteSelection = {
  supplierId: number | null
  quote: ProductSupplierQuote | null
}

export function selectQuoteSupplier(
  quotes: ProductSupplierQuote[],
  defaultSupplierId?: number | null,
  currentSupplierId?: number | null
): QuoteSelection {
  if (quotes.length === 0) {
    return { supplierId: null, quote: null }
  }

  const current = currentSupplierId
    ? quotes.find(item => item.supplier_id === currentSupplierId)
    : undefined
  if (current) {
    return { supplierId: current.supplier_id, quote: current }
  }

  const fallbackDefault = defaultSupplierId
    ? quotes.find(item => item.supplier_id === defaultSupplierId)
    : undefined
  if (fallbackDefault) {
    return { supplierId: fallbackDefault.supplier_id, quote: fallbackDefault }
  }

  return { supplierId: quotes[0].supplier_id, quote: quotes[0] }
}

export function applyQuoteToDraftItem(item: DraftItem, quote: ProductSupplierQuote): void {
  item.supplier_id = quote.supplier_id
  const price = Number(quote.price)
  if (Number.isFinite(price)) {
    item.unit_cost = price
  }
  const moq = Number(quote.qty_moq)
  if (Number.isFinite(moq) && moq > 0 && item.qty_ordered < moq) {
    item.qty_ordered = moq
  }
}
