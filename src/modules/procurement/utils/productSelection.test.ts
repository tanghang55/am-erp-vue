import { describe, it, expect } from 'vitest'
import {
  expandComboProducts,
  mergeDraftItems,
  filterSelectableProducts,
  sortItemsByCombo
} from '@/modules/procurement/utils/productSelection'
import type { ProductSummary, ProductCombo } from '@/modules/product/types'
import type { DraftItem, ExpandedProduct } from '@/modules/procurement/utils/productSelection'

const baseProduct = (overrides: Partial<ProductSummary>): ProductSummary => ({
  id: 0,
  seller_sku: '',
  asin: '',
  title: '',
  marketplace: 'US',
  status: 'ACTIVE',
  gmt_create: '',
  gmt_modified: '',
  ...overrides
})

describe('productSelection', () => {
  it('expands combo main into main and children', async () => {
    const main = baseProduct({ id: 1, seller_sku: 'A', combo_id: 10, is_combo_main: 1 })
    const child = {
      ...baseProduct({ id: 2, seller_sku: 'B', combo_id: 10, is_combo_main: 0 }),
      qty_ratio: 3
    }

    const fetchCombo = async (comboId: number): Promise<ProductCombo | null> => {
      if (comboId !== 10) return null
      return {
        combo_id: comboId,
        main_product: main,
        products: [child]
      }
    }

    const result = await expandComboProducts([main], fetchCombo)
    const ids = result.items.map(item => item.product.id).sort()

    expect(result.errors).toEqual([])
    expect(ids).toEqual([1, 2])
    expect(result.items[0].combo?.combo_id).toBe(10)
    expect(result.items[0].combo_role).toBe('main')
    expect(result.items[1].combo_role).toBe('child')
    expect(result.items[1].qty_ratio).toBe(3)
  })

  it('merges selected products into existing items', () => {
    const main = baseProduct({ id: 1, seller_sku: 'A' })
    const child = baseProduct({ id: 2, seller_sku: 'B' })

    const existing: DraftItem[] = [
      { product_id: main.id, qty_ordered: 1, unit_cost: 2, product: main, combo: null }
    ]
    const additions: ExpandedProduct[] = [{ product: main, combo: null }, { product: child, combo: null }]

    const merged = mergeDraftItems(existing, additions)
    const mainItem = merged.find(item => item.product_id === main.id)
    const childItem = merged.find(item => item.product_id === child.id)

    expect(merged).toHaveLength(2)
    expect(mainItem?.qty_ordered).toBe(2)
    expect(childItem?.qty_ordered).toBe(1)
  })

  it('keeps combo items separated by combo id', () => {
    const product = baseProduct({ id: 3, seller_sku: 'C' })
    const additions: ExpandedProduct[] = [
      { product, combo: { combo_id: 11, main_product_code: 'A' }, combo_role: 'child' },
      { product, combo: { combo_id: 12, main_product_code: 'X' }, combo_role: 'child' }
    ]

    const merged = mergeDraftItems([], additions)

    expect(merged).toHaveLength(2)
    expect(merged[0].combo?.combo_id).not.toBe(merged[1].combo?.combo_id)
  })

  it('uses combo qty_ratio when merging child items', () => {
    const child = { ...baseProduct({ id: 7, seller_sku: 'CHILD-7' }), qty_ratio: 4 }
    const additions: ExpandedProduct[] = [
      { product: child, combo: { combo_id: 21, main_product_code: 'MAIN-21' }, combo_role: 'child', qty_ratio: 4 }
    ]

    const merged = mergeDraftItems([], additions)

    expect(merged).toHaveLength(1)
    expect(merged[0].qty_ordered).toBe(4)
  })

  it('filters combo children in product picker list', () => {
    const main = baseProduct({ id: 4, combo_id: 20, is_combo_main: 1 })
    const child = baseProduct({ id: 5, combo_id: 20, is_combo_main: 0 })
    const normal = baseProduct({ id: 6 })

    const filtered = filterSelectableProducts([main, child, normal])
    const ids = filtered.map(item => item.id).sort()

    expect(ids).toEqual([4, 6])
  })

  it('orders combo items by main then children', () => {
    const main = baseProduct({ id: 10, seller_sku: 'MAIN' })
    const child = baseProduct({ id: 11, seller_sku: 'CHILD' })
    const normal = baseProduct({ id: 12, seller_sku: 'NORMAL' })
    const combo = { combo_id: 99, main_product_code: 'MAIN' }

    const items: DraftItem[] = [
      {
        product_id: child.id,
        qty_ordered: 1,
        unit_cost: 0,
        product: child,
        combo,
        combo_role: 'child'
      },
      {
        product_id: normal.id,
        qty_ordered: 1,
        unit_cost: 0,
        product: normal,
        combo: null
      },
      {
        product_id: main.id,
        qty_ordered: 1,
        unit_cost: 0,
        product: main,
        combo,
        combo_role: 'main'
      }
    ]

    const ordered = sortItemsByCombo(items)

    expect(ordered.map(item => item.product_id)).toEqual([10, 11, 12])
  })

  it('returns error when combo fetch fails', async () => {
    const main = baseProduct({ id: 20, seller_sku: 'ERR', combo_id: 99, is_combo_main: 1 })

    const fetchCombo = async (): Promise<ProductCombo | null> => {
      throw new Error('network')
    }

    const result = await expandComboProducts([main], fetchCombo)

    expect(result.items).toEqual([])
    expect(result.errors).toContain('combo_not_found')
  })
})
