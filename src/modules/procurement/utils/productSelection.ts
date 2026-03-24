import type { ProductCombo, ProductSummary } from '@/modules/product/types'

export type ComboSource = {
  combo_id: number
  main_product_code?: string
}

export type ExpandedProduct = {
  product: ProductSummary
  combo: ComboSource | null
  combo_role?: 'main' | 'child'
  qty_ratio?: number
}

export type DraftItem = {
  product_id: number
  qty_ordered: number
  unit_cost: number
  product?: ProductSummary | null
  combo?: ComboSource | null
  combo_role?: 'main' | 'child'
  supplier_id?: number | null
}

export type ComboFetcher = (comboId: number) => Promise<ProductCombo | null>

export type ExpandResult = {
  items: ExpandedProduct[]
  errors: string[]
}

export async function expandComboProducts(
  selected: ProductSummary[],
  fetchCombo: ComboFetcher
): Promise<ExpandResult> {
  const items: ExpandedProduct[] = []
  const errors: string[] = []

  for (const product of selected) {
    if (product.is_combo_main === 1 && product.combo_id) {
      const comboId = Number(product.combo_id)
      let combo: ProductCombo | null = null
      try {
        combo = await fetchCombo(comboId)
      } catch {
        errors.push('combo_not_found')
        continue
      }
      if (!combo) {
        errors.push('combo_not_found')
        continue
      }
      if (!combo.products || combo.products.length === 0) {
        errors.push('combo_missing')
        continue
      }

      const mainProduct = combo.main_product?.id ? combo.main_product : product
      const comboLabel: ComboSource = { combo_id: comboId, main_product_code: mainProduct.seller_sku }

      items.push({ product: mainProduct, combo: comboLabel, combo_role: 'main' })
      for (const child of combo.products) {
        if (child.id === mainProduct.id) {
          continue
        }
        items.push({
          product: child,
          combo: comboLabel,
          combo_role: 'child',
          qty_ratio: child.qty_ratio || 1
        })
      }
      continue
    }

    items.push({ product, combo: null })
  }

  return { items, errors }
}

export function mergeDraftItems(existing: DraftItem[], additions: ExpandedProduct[]): DraftItem[] {
  const result: DraftItem[] = existing.map(item => ({ ...item }))
  const itemMap = new Map<string, DraftItem>()
  result.forEach(item => itemMap.set(getItemKey(item.product_id, item.combo, item.combo_role), item))

  for (const addition of additions) {
    const product = addition.product
    const quantityToAdd = addition.qty_ratio || 1
    const key = getItemKey(product.id, addition.combo, addition.combo_role)
    const current = itemMap.get(key)
    if (current) {
      current.qty_ordered += quantityToAdd
      if (!current.product) {
        current.product = product
      }
      if (!current.combo && addition.combo) {
        current.combo = addition.combo
      }
      if (!current.combo_role && addition.combo_role) {
        current.combo_role = addition.combo_role
      }
      if (!current.unit_cost) {
        current.unit_cost = parseUnitCost(product)
      }
      if (!current.supplier_id) {
        current.supplier_id = parseSupplierID(product)
      }
      continue
    }

    const nextItem: DraftItem = {
      product_id: product.id,
      qty_ordered: quantityToAdd,
      unit_cost: parseUnitCost(product),
      product,
      combo: addition.combo,
      combo_role: addition.combo_role,
      supplier_id: parseSupplierID(product)
    }
    result.push(nextItem)
    itemMap.set(key, nextItem)
  }

  return result
}

export function filterSelectableProducts(items: ProductSummary[]): ProductSummary[] {
  return items.filter(item => !item.combo_id || item.is_combo_main === 1)
}

export function sortItemsByCombo(items: DraftItem[]): DraftItem[] {
  const result: DraftItem[] = []
  const inserted = new Set<number>()

  for (const item of items) {
    const comboId = item.combo?.combo_id
    if (!comboId) {
      result.push(item)
      continue
    }
    if (inserted.has(comboId)) {
      continue
    }
    inserted.add(comboId)
    const group = items.filter(entry => entry.combo?.combo_id === comboId)
    const mains = group.filter(entry => entry.combo_role === 'main')
    const children = group.filter(entry => entry.combo_role === 'child')
    const rest = group.filter(entry => entry.combo_role !== 'main' && entry.combo_role !== 'child')
    result.push(...mains, ...children, ...rest)
  }

  return result
}

function parseUnitCost(product: ProductSummary): number {
  const raw = product.unit_cost ?? 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function parseSupplierID(product: ProductSummary): number | null {
  if (product.supplier_id) {
    return product.supplier_id
  }
  if (product.supplier?.id) {
    return product.supplier.id
  }
  return null
}

function getItemKey(productID: number, combo: ComboSource | null | undefined, role?: string): string {
  if (!combo) {
    return `product:${productID}`
  }
  return `combo:${combo.combo_id}:product:${productID}:role:${role || 'item'}`
}
