import type { DraftItem } from '@/modules/procurement/utils/productSelection'
import type { CreatePurchaseOrderParams } from '@/modules/procurement/types'

export type SupplierGroup = {
  supplier_id: number
  items: DraftItem[]
}

export type SupplierGroupResult = SupplierGroup[] & { missing: DraftItem[] }

export type PurchaseOrderBase = Pick<
  CreatePurchaseOrderParams,
  'marketplace' | 'currency' | 'remark'
>

export type BuildCreatePayloadsResult = {
  payloads: CreatePurchaseOrderParams[]
  missing: DraftItem[]
}

export function groupItemsBySupplier(items: DraftItem[]): SupplierGroupResult {
  const groups = [] as SupplierGroupResult
  groups.missing = []

  const map = new Map<number, SupplierGroup>()
  for (const item of items) {
    const supplierId = item.supplier_id
    if (!supplierId) {
      groups.missing.push(item)
      continue
    }
    const existing = map.get(supplierId)
    if (existing) {
      existing.items.push(item)
      continue
    }
    const group: SupplierGroup = { supplier_id: supplierId, items: [item] }
    map.set(supplierId, group)
    groups.push(group)
  }

  return groups
}

export function buildCreatePayloads(
  base: PurchaseOrderBase,
  items: DraftItem[]
): BuildCreatePayloadsResult {
  const groups = groupItemsBySupplier(items)
  const payloads = groups
    .map(group => {
      const orderItems = group.items
        .filter(item => item.product_id)
        .map(item => ({
          product_id: item.product_id,
          qty_ordered: item.qty_ordered,
          unit_cost: Number(item.unit_cost || 0)
        }))
      if (orderItems.length === 0) {
        return null
      }
      return {
        supplier_id: group.supplier_id,
        marketplace: base.marketplace,
        currency: base.currency,
        remark: base.remark,
        items: orderItems
      }
    })
    .filter((payload): payload is CreatePurchaseOrderParams => Boolean(payload))

  return { payloads, missing: groups.missing }
}
