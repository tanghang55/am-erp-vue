import type { Sku, ProductCombo } from '@/modules/product/types'

export type ComboSource = {
  combo_id: number
  main_sku?: string
}

export type ExpandedSku = {
  sku: Sku
  combo: ComboSource | null
  combo_role?: 'main' | 'child'
}

export type DraftItem = {
  sku_id: number
  qty_ordered: number
  unit_cost: number
  sku?: Sku | null
  combo?: ComboSource | null
  combo_role?: 'main' | 'child'
  supplier_id?: number | null
}

export type ComboFetcher = (comboId: number) => Promise<ProductCombo | null>

export type ExpandResult = {
  items: ExpandedSku[]
  errors: string[]
}

export async function expandComboSkus(selected: Sku[], fetchCombo: ComboFetcher): Promise<ExpandResult> {
  const items: ExpandedSku[] = []
  const errors: string[] = []

  for (const sku of selected) {
    if (sku.is_combo_main === 1 && sku.combo_id) {
      const comboId = Number(sku.combo_id)
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

      const mainSku = combo.main_product?.id ? combo.main_product : sku
      const comboLabel: ComboSource = { combo_id: comboId, main_sku: mainSku.seller_sku }

      items.push({ sku: mainSku, combo: comboLabel, combo_role: 'main' })
      for (const child of combo.products) {
        if (child.id === mainSku.id) {
          continue
        }
        items.push({ sku: child, combo: comboLabel, combo_role: 'child' })
      }
      continue
    }

    items.push({ sku, combo: null })
  }

  return { items, errors }
}

export function mergeDraftItems(existing: DraftItem[], additions: ExpandedSku[]): DraftItem[] {
  const result: DraftItem[] = existing.map(item => ({ ...item }))
  const itemMap = new Map<string, DraftItem>()
  result.forEach(item => itemMap.set(getItemKey(item.sku_id, item.combo, item.combo_role), item))

  for (const addition of additions) {
    const sku = addition.sku
    const key = getItemKey(sku.id, addition.combo, addition.combo_role)
    const current = itemMap.get(key)
    if (current) {
      current.qty_ordered += 1
      if (!current.sku) {
        current.sku = sku
      }
      if (!current.combo && addition.combo) {
        current.combo = addition.combo
      }
      if (!current.combo_role && addition.combo_role) {
        current.combo_role = addition.combo_role
      }
      if (!current.unit_cost) {
        current.unit_cost = parseUnitCost(sku)
      }
      if (!current.supplier_id) {
        current.supplier_id = parseSupplierID(sku)
      }
      continue
    }

    const nextItem: DraftItem = {
      sku_id: sku.id,
      qty_ordered: 1,
      unit_cost: parseUnitCost(sku),
      sku,
      combo: addition.combo,
      combo_role: addition.combo_role,
      supplier_id: parseSupplierID(sku)
    }
    result.push(nextItem)
    itemMap.set(key, nextItem)
  }

  return result
}

export function filterSelectableSkus(items: Sku[]): Sku[] {
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

function parseUnitCost(sku: Sku): number {
  const raw = sku.unit_cost ?? 0
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

function parseSupplierID(sku: Sku): number | null {
  if (sku.supplier_id) {
    return sku.supplier_id
  }
  if (sku.supplier?.id) {
    return sku.supplier.id
  }
  return null
}

function getItemKey(skuID: number, combo: ComboSource | null | undefined, role?: string): string {
  if (!combo) {
    return `sku:${skuID}`
  }
  return `combo:${combo.combo_id}:sku:${skuID}:role:${role || 'item'}`
}
