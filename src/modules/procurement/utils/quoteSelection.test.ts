import { describe, it, expect } from 'vitest'
import { selectQuoteSupplier, applyQuoteToDraftItem } from '@/modules/procurement/utils/quoteSelection'
import type { DraftItem } from '@/modules/procurement/utils/productSelection'
import type { ProductSupplierQuote } from '@/modules/supplier/types'

const quote = (overrides: Partial<ProductSupplierQuote>): ProductSupplierQuote => ({
  id: 1,
  product_id: 1,
  supplier_id: 10,
  price: 1.23,
  currency: 'USD',
  qty_moq: 1,
  lead_time_days: 7,
  status: 'ACTIVE',
  ...overrides
})

describe('quoteSelection', () => {
  it('keeps current supplier when available', () => {
    const quotes = [quote({ supplier_id: 10 }), quote({ supplier_id: 20 })]

    const result = selectQuoteSupplier(quotes, 20, 10)

    expect(result.supplierId).toBe(10)
    expect(result.quote?.supplier_id).toBe(10)
  })

  it('falls back to default supplier when current missing', () => {
    const quotes = [quote({ supplier_id: 10 }), quote({ supplier_id: 20 })]

    const result = selectQuoteSupplier(quotes, 20, 99)

    expect(result.supplierId).toBe(20)
    expect(result.quote?.supplier_id).toBe(20)
  })

  it('falls back to first quote when default missing', () => {
    const quotes = [quote({ supplier_id: 10 }), quote({ supplier_id: 20 })]

    const result = selectQuoteSupplier(quotes, 0, null)

    expect(result.supplierId).toBe(10)
    expect(result.quote?.supplier_id).toBe(10)
  })

  it('returns null when no quotes', () => {
    const result = selectQuoteSupplier([], 10, 10)

    expect(result.supplierId).toBeNull()
    expect(result.quote).toBeNull()
  })

  it('applies quote price and MOQ to draft item', () => {
    const item: DraftItem = {
      product_id: 1,
      qty_ordered: 2,
      unit_cost: 0
    }
    const target = quote({ supplier_id: 20, price: 5.5, qty_moq: 10 })

    applyQuoteToDraftItem(item, target)

    expect(item.supplier_id).toBe(20)
    expect(item.unit_cost).toBe(5.5)
    expect(item.qty_ordered).toBe(10)
  })
})
