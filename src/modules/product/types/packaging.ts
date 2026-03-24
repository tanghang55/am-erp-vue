export interface ProductPackagingItem {
  id?: number
  product_id?: number
  packaging_item_id: number
  quantity_per_unit: number
  packaging_item?: {
    id: number
    item_code: string
    item_name: string
    specification?: string
    unit: string
    unit_cost: number
    currency: string
    quantity_on_hand: number
  }
}

export interface SaveProductPackagingParams {
  packaging_items: Array<{
    packaging_item_id: number
    quantity_per_unit: number
  }>
}
