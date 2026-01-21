import { describe, it, expect } from 'vitest'
import {
  expandComboSkus,
  mergeDraftItems,
  filterSelectableSkus,
  sortItemsByCombo
} from '@/modules/procurement/utils/skuSelection'
import type { Sku, ProductCombo } from '@/modules/product/types'
import type { DraftItem, ExpandedSku } from '@/modules/procurement/utils/skuSelection'

const baseSku = (overrides: Partial<Sku>): Sku => ({
  id: 0,
  seller_sku: '',
  asin: '',
  title: '',
  marketplace: 'US',
  status: 'ACTIVE',
  created_at: '',
  updated_at: '',
  ...overrides
})

describe('skuSelection', () => {
  it('expands combo main into main and children', async () => {
    const main = baseSku({ id: 1, seller_sku: 'A', combo_id: 10, is_combo_main: 1 })
    const child = baseSku({ id: 2, seller_sku: 'B', combo_id: 10, is_combo_main: 0 })

    const fetchCombo = async (comboId: number): Promise<ProductCombo | null> => {
      if (comboId !== 10) return null
      return {
        combo_id: comboId,
        main_product: main,
        products: [child]
      }
    }

    const result = await expandComboSkus([main], fetchCombo)
    const ids = result.items.map(item => item.sku.id).sort()

    expect(result.errors).toEqual([])
    expect(ids).toEqual([1, 2])
    expect(result.items[0].combo?.combo_id).toBe(10)
    expect(result.items[0].combo_role).toBe('main')
    expect(result.items[1].combo_role).toBe('child')
  })

  it('merges selected skus into existing items', () => {
    const main = baseSku({ id: 1, seller_sku: 'A' })
    const child = baseSku({ id: 2, seller_sku: 'B' })

    const existing: DraftItem[] = [
      { sku_id: main.id, qty_ordered: 1, unit_cost: 2, sku: main, combo: null }
    ]
    const additions: ExpandedSku[] = [{ sku: main, combo: null }, { sku: child, combo: null }]

    const merged = mergeDraftItems(existing, additions)
    const mainItem = merged.find(item => item.sku_id === main.id)
    const childItem = merged.find(item => item.sku_id === child.id)

    expect(merged).toHaveLength(2)
    expect(mainItem?.qty_ordered).toBe(2)
    expect(childItem?.qty_ordered).toBe(1)
  })

  it('keeps combo items separated by combo id', () => {
    const sku = baseSku({ id: 3, seller_sku: 'C' })
    const additions: ExpandedSku[] = [
      { sku, combo: { combo_id: 11, main_sku: 'A' }, combo_role: 'child' },
      { sku, combo: { combo_id: 12, main_sku: 'X' }, combo_role: 'child' }
    ]

    const merged = mergeDraftItems([], additions)

    expect(merged).toHaveLength(2)
    expect(merged[0].combo?.combo_id).not.toBe(merged[1].combo?.combo_id)
  })

  it('filters combo children in sku picker list', () => {
    const main = baseSku({ id: 4, combo_id: 20, is_combo_main: 1 })
    const child = baseSku({ id: 5, combo_id: 20, is_combo_main: 0 })
    const normal = baseSku({ id: 6 })

    const filtered = filterSelectableSkus([main, child, normal])
    const ids = filtered.map(item => item.id).sort()

    expect(ids).toEqual([4, 6])
  })

  it('orders combo items by main then children', () => {
    const main = baseSku({ id: 10, seller_sku: 'MAIN' })
    const child = baseSku({ id: 11, seller_sku: 'CHILD' })
    const normal = baseSku({ id: 12, seller_sku: 'NORMAL' })
    const combo = { combo_id: 99, main_sku: 'MAIN' }

    const items: DraftItem[] = [
      {
        sku_id: child.id,
        qty_ordered: 1,
        unit_cost: 0,
        sku: child,
        combo,
        combo_role: 'child'
      },
      {
        sku_id: normal.id,
        qty_ordered: 1,
        unit_cost: 0,
        sku: normal,
        combo: null
      },
      {
        sku_id: main.id,
        qty_ordered: 1,
        unit_cost: 0,
        sku: main,
        combo,
        combo_role: 'main'
      }
    ]

    const ordered = sortItemsByCombo(items)

    expect(ordered.map(item => item.sku_id)).toEqual([10, 11, 12])
  })

  it('returns error when combo fetch fails', async () => {
    const main = baseSku({ id: 20, seller_sku: 'ERR', combo_id: 99, is_combo_main: 1 })

    const fetchCombo = async (): Promise<ProductCombo | null> => {
      throw new Error('network')
    }

    const result = await expandComboSkus([main], fetchCombo)

    expect(result.items).toEqual([])
    expect(result.errors).toContain('combo_not_found')
  })
})
