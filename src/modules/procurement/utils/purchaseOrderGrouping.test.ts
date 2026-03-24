import { describe, it, expect } from 'vitest'
import {
  groupItemsBySupplier,
  buildCreatePayloads
} from '@/modules/procurement/utils/purchaseOrderGrouping'
import type { DraftItem } from '@/modules/procurement/utils/productSelection'

describe('purchaseOrderGrouping', () => {
  it('groups items by supplier id', () => {
    const items: DraftItem[] = [
      { product_id: 1, qty_ordered: 1, unit_cost: 2, supplier_id: 10 },
      { product_id: 2, qty_ordered: 2, unit_cost: 3, supplier_id: 10 },
      { product_id: 3, qty_ordered: 1, unit_cost: 1, supplier_id: 20 }
    ]

    const groups = groupItemsBySupplier(items)

    expect(groups).toHaveLength(2)
    expect(groups.find(group => group.supplier_id === 10)?.items).toHaveLength(2)
    expect(groups.find(group => group.supplier_id === 20)?.items).toHaveLength(1)
  })

  it('tracks items missing supplier', () => {
    const items: DraftItem[] = [
      { product_id: 1, qty_ordered: 1, unit_cost: 2, supplier_id: null },
      { product_id: 2, qty_ordered: 1, unit_cost: 3, supplier_id: 10 }
    ]

    const groups = groupItemsBySupplier(items)

    expect(groups.missing).toHaveLength(1)
    expect(groups.missing[0].product_id).toBe(1)
  })

  it('builds create payloads per supplier', () => {
    const items: DraftItem[] = [
      { product_id: 1, qty_ordered: 1, unit_cost: 2, supplier_id: 10 },
      { product_id: 2, qty_ordered: 2, unit_cost: 3, supplier_id: 10 },
      { product_id: 3, qty_ordered: 1, unit_cost: 1, supplier_id: 20 }
    ]

    const result = buildCreatePayloads(
      { marketplace: 'US', currency: 'USD', remark: 'note' },
      items
    )

    expect(result.payloads).toHaveLength(2)
    const supplier10 = result.payloads.find(payload => payload.supplier_id === 10)
    const supplier20 = result.payloads.find(payload => payload.supplier_id === 20)
    expect(supplier10?.items).toHaveLength(2)
    expect(supplier20?.items).toHaveLength(1)
    expect(supplier10?.marketplace).toBe('US')
  })

  it('returns missing payload items when supplier is empty', () => {
    const items: DraftItem[] = [
      { product_id: 1, qty_ordered: 1, unit_cost: 2, supplier_id: null },
      { product_id: 2, qty_ordered: 1, unit_cost: 3, supplier_id: 10 }
    ]

    const result = buildCreatePayloads({ currency: 'USD' }, items)

    expect(result.payloads).toHaveLength(1)
    expect(result.missing).toHaveLength(1)
    expect(result.missing[0].product_id).toBe(1)
  })
})
